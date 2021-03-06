class Toggler {
    
    
    static get TransitionEnd() {
        return 'transition' in document.documentElement.style ? 'transitionend' : 
        'WebkitTransition' in document.documentElement.style ? 'webkitTransitionEnd' : null;
    }
    
    
    static getPlugin(element) {
        return element.Toggler || new Toggler(element);
    } 
 
    
    constructor() {
        if (arguments.length) {
            let element = arguments[0];
            if (typeof element == 'string') {
                element = document.body.querySelector(element);
            }
            if (element instanceof HTMLElement) {
                if (element.Toggler)
                    return element.Toggler;
                
                element.Toggler = this;
                this.element = element;
                this.element.classList.add( Toggler.Config.CLASS_BASE );
            }
        }
    }

    
    show(collection = null, force = false, force_siblings = false) {
        const el = this.element;
        let others = [];
        
        if (this.isVisible() || this.isTransitioning()) {
            return;
        }
        
        collection: 
        if (collection) {
            collection = typeof collection == 'string' ? document.body.querySelector(collection) : collection;
            if (!collection) break collection;
            

            // find siblings in given collection
            others = collection.querySelectorAll('.' + Toggler.Config.CLASS_BASE);
            if (!others) break collection;
            others = Array.prototype.slice.call(others).filter(e => !e.isSameNode(el));

            for(let i = 0; i < others.length; i++) {
                const toggler = Toggler.getPlugin( others[i] );
                // stop if any of siblings are transitioning
                if (toggler.isTransitioning())
                    return;
                
                // or close if visible
                if (toggler.isVisible())
                    toggler.hide(null, force || force_siblings);
            }
        }
        
        

        if (force) {
            el.classList.add( Toggler.Config.CLASS_VISIBLE );
            this._triggerCheck();
            this._dispatchEvent('show');
            return;
        }

        let afterTransition = () => {
            el.classList.add( Toggler.Config.CLASS_VISIBLE );
            
            if (this.isFadeAnimation() || this.isSlideFadeAnimation()) {
                el.style.opacity = null;
            }
            if (!this.isFadeAnimation()) {
                el.style.height = null;
            }
            
            this._removeTransitionEndListener(afterTransition);
            el.classList.remove( Toggler.Config.CLASS_TRANSITIONING );
            
            this._triggerCheck();
            this._dispatchEvent('show');
        };


        if (this.isFadeAnimation() || this.isSlideFadeAnimation()) {
            el.style.opacity = 0;
        }
        if (!this.isFadeAnimation()) {
            el.style.height = 0;
        }
        
        el.classList.add( Toggler.Config.CLASS_TRANSITIONING );
        this._repaint();
        this._addTransitionEndListener(afterTransition);

        if (this.isFadeAnimation() || this.isSlideFadeAnimation()) {
            el.style.opacity = 1;
        }
        if (!this.isFadeAnimation()) {
            el.style.height = el.scrollHeight + 'px';
        }
        
    }
    

    hide(collection = null, force = false) {
        const el = this.element;
        let others = [];
        
        if (this.isHidden() || this.isTransitioning()) {
            return;
        } 

        if (force) {
            this.element.classList.remove( Toggler.Config.CLASS_VISIBLE );
            this._triggerCheck();
            this._dispatchEvent('hide');
            return;
        }

        let afterTransition = () => {
            if (this.isFadeAnimation() || this.isSlideFadeAnimation()) {
                el.style.opacity = null;
            }
            if (!this.isFadeAnimation()) {
                el.style.height = null;
            }
            this._removeTransitionEndListener(afterTransition);
            el.classList.remove( Toggler.Config.CLASS_TRANSITIONING );

            this._triggerCheck();
            this._dispatchEvent('hide');
        };

        el.classList.add( Toggler.Config.CLASS_TRANSITIONING );
        el.classList.remove( Toggler.Config.CLASS_VISIBLE );
        

        if (this.isFadeAnimation() || this.isSlideFadeAnimation()) {
            el.style.opacity = 1;
        }
        if (!this.isFadeAnimation()) {
            el.style.height = el.offsetHeight + 'px';
        }

        this._repaint();
        
        this._addTransitionEndListener(afterTransition);

        if (this.isFadeAnimation() || this.isSlideFadeAnimation()) {
            el.style.opacity = 0;
        }
        if (!this.isFadeAnimation()) {
            el.style.height = 0;
        }
    }


    tab(collection = null, force = false) {
        this.show(collection, force, true);
    }
    

    toggle(collection = null, force = false) {
        if (this.isHidden()) {
            this.show(collection, force);
        }
        else {
            this.hide(null, force);
        }
    }

    isTransitioning() {
        return this.element.classList.contains( Toggler.Config.CLASS_TRANSITIONING );
    }

    isVisible() {
        return this.element.classList.contains( Toggler.Config.CLASS_VISIBLE );
    }

    isHidden() {
        return !this.isVisible();
    }
    
    isFadeAnimation() {
        return this.element.classList.contains( Toggler.Config.CLASS_FADE );
    }
    
    isSlideFadeAnimation() {
        return this.element.classList.contains( Toggler.Config.CLASS_SLIDEFADE );
    }
    
    isSlideAnimation() {
        return !this.element.classList.contains( Toggler.Config.CLASS_FADE ) && !this.element.classList.contains( Toggler.Config.CLASS_SLIDEFADE );
    }
    
    // check trigger (add/remove class CLASS_TARGET_VISIBLE)
    _triggerCheck() {
        const triggers = document.body.querySelectorAll('[data-toggler]');
        Array.prototype.slice.call(triggers).forEach(trigger => {
            let datatarget;
            if (trigger.dataset.togglerTarget !== undefined) {
                datatarget = trigger.dataset.togglerTarget;
            }
            else if (trigger.hasAttribute('href')) {
                datatarget = trigger.getAttribute('href');
            }

            if (datatarget) {
                const targets = document.body.querySelectorAll(datatarget);
                Array.prototype.slice.call(targets).forEach(target => {
                    if (target.isSameNode(this.element)) {
                        if (Toggler.getPlugin(target).isVisible())
                            trigger.classList.add( Toggler.Config.CLASS_TARGET_VISIBLE );
                        else {
                            trigger.classList.remove( Toggler.Config.CLASS_TARGET_VISIBLE );
                        }
                    }
                });
            }
        });
    }
    
    _repaint() {
        getComputedStyle(this.element).height;
    }
    
    _dispatchEvent(name) {
        let event;
        try {
            event = new Event('toggler.' + name);
        }
        catch (error) {
            event = document.createEvent('Event');
            event.initEvent('toggler.' + name, false, false);
        }
        this.element.dispatchEvent(event);
    }
    
    _addTransitionEndListener(callback) {
        // no transition support
        if (!Toggler.TransitionEnd) {
            callback();
            return;
        }

        this.element.addEventListener(Toggler.TransitionEnd, callback);
    }
    
    _removeTransitionEndListener(callback) {
        // no transition support
        if (!Toggler.TransitionEnd) {
            return;
        }

        this.element.removeEventListener(Toggler.TransitionEnd, callback);
    }
    
    static AddEventClick() {
        
        // body.onclick delegate
        if (Toggler.Config.DELEGATE_CLICK) {
            document.body.addEventListener('click', event => {
                let trigger;
                for(let element = event.target; element != document.body; element = element.parentElement) {
                    if (element.dataset.toggler !== undefined) {
                        trigger = element;
                        break;
                    }
                }
                if (!trigger) 
                    return;

                event.preventDefault();
                
                triggerClickActions(trigger);
            });
        }
        
        // [data-toggler].onclick
        else {
            const triggers = document.body.querySelectorAll('[data-toggler]');
            if (!triggers.length)
                return;
            
            Array.prototype.slice.call(triggers).forEach(trigger => {
                trigger.addEventListener('click', event => {
                    event.preventDefault();

                    triggerClickActions(trigger);
                });
            });
        }
        
        function triggerClickActions(trigger) { 
            let datatarget;
            if (trigger.dataset.togglerTarget !== undefined) {
                datatarget = trigger.dataset.togglerTarget;
            }
            else if (trigger.hasAttribute('href')) {
                datatarget = trigger.getAttribute('href');
            }

            if (!datatarget)
                return;

            const targets = document.body.querySelectorAll(datatarget);
            const action = (trigger.dataset.toggler.match(/(show|hide|tab)/gi) || ['toggle'])[0].toLowerCase();
            const force = trigger.dataset.togglerForce === "" || /^(1|true|yes)$/gi.test(trigger.dataset.togglerForce) ? true : false;
            const collection = document.body.querySelector(trigger.dataset.togglerCollection);

            Array.prototype.slice.call(targets).forEach(target => {
                Toggler.getPlugin(target)[action](collection, force); 
            });  
        };
    }
     
    static Init(config) {
        
        // config
        Toggler.Config = {
            CLASS_BASE: 'js-toggler',
            CLASS_VISIBLE: 'is-visible',
            CLASS_TARGET_VISIBLE: 'is-target-visible',
            CLASS_TRANSITIONING: 'is-transitioning',
            CLASS_FADE: 'is-fade',
            CLASS_SLIDEFADE: 'is-slidefade',
            DELEGATE_CLICK: false
        };
        
        Object.keys(config || {}).forEach(function(name) {
            Toggler.Config[name] = config[name];
        });
        
        const init = () => {
            
            // add click events for triggers
            Toggler.AddEventClick();
            
            // check all triggers (to add CLASS_TARGET_VISIBLE class on trigger/init Toggler on target)
            const triggers = document.body.querySelectorAll('[data-toggler]');
            
            Array.prototype.slice.call(triggers).forEach(trigger => {
                let datatarget;
                if (trigger.dataset.togglerTarget !== undefined) {
                    datatarget = trigger.dataset.togglerTarget;
                }
                else if (trigger.hasAttribute('href')) {
                    datatarget = trigger.getAttribute('href');
                }

                if (datatarget) {
                    const targets = document.body.querySelectorAll(datatarget);
                    // init targets
                    Array.prototype.slice.call(targets).forEach(target => {
                        if (Toggler.getPlugin(target).isVisible())
                            trigger.classList.add( Toggler.Config.CLASS_TARGET_VISIBLE );
                        else {
                            trigger.classList.remove( Toggler.Config.CLASS_TARGET_VISIBLE );
                        }
                    });
                }
            });
        };
        
        document.readyState == 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
        Toggler.Init = null;
    }
}