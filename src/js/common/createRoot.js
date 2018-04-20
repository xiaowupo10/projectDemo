/**
 * @author
 * 
 * 将页面按照结构划分为几个模块，每个模块对应一个section标签
 * 目的：1）方便多人同时开发单个页面
 *       2）统一js代码组织
 */

/**
 * 创建全局变量对象
 * @return {object} 
 */
function createRootVariable() {
    var app = {
        /**
         * 全局的配置对象，包含各个模块共用的常量
         * !!!不允许隐性为config里添加属性
         * !!!所有用到的config属性必须在该对象里先进行声明
         * @type {Object}
         */
        config: {},

        /**
         * 全局的DOM事件，每个部分的DOM事件请写在自己的模块里
         * 格式为：
         * 'selector1&selector2': {
         *     eventName1: function(root, e) {
         *     },
         *     eventName2: function(root, e) {
         *     }
         * }
         * 上述代码表示：将选择器为selector2的元素的eventName1、eventName2事件委托到选择器为selector1的元素上
         * event handler默认参数有两个，分别是root和e
         * 
         * @type {Object}
         */
        events: {},

        /**
         * 包含将页面拆分开的所有模块
         * @type {Object}
         */
        modules: {},

        /**
         * 全局的初始化函数，会发布global.init事件，其他订阅该事件，实现各自模块的初始化
         * 
         */
        init: function() {
            var root = this;
            
            //委托事件
            root._delegate(root.events);

            //创建各个js模块
            root._loadModuleJs();

            //发布全局的初始化事件
            root.pubsub.fire('root.init', null);
        },

        /**
         * 包含所有模块可用的公共工具函数
         */
        helpers: {},

        /**
         * 包含root的处理函数
         * @type {Object}
         */
        handles: {},

        /**
         * 挂载每个模块的js对象的创建方法
         * 
         * 对应每个模块js的创建方法demo
         * createModuleNameBoxModule 方法demo，该方法写在单个模块对应的js里面
         *
         * rootName.moduleCreateFns.createModuleNameBoxModule = function(root) {
         *     root.modules.moduleNameBox = new root.Module(root, 'moduleNameBox');
         *     var moduleRoot = root.modules.moduleNameBox;
         *       
         *     //不允许隐形为config里添加属性
         *     //所有用到的config属性必须在该对象里面先进行声明
         *     moduleRoot.config = {};
         *
         *     //dom事件必须委托到该section下
         *     //一般情况下不允许委托到其他地方，尤其是类名下面
         *     moduleRoot.events = {};
         *     moduleRoot.handles = {};
         *
         *     //在这里放模块初始化时要做的操作
         *     moduleRoot.pubsub.on('moduleNameBox.init', 'moduleNameBox', function() {
         *     });  
         * };
         */
        moduleCreateFns: {},

        /**
         * 用于生成每个模块的js对象
         * @param {object} root 
         * @param {string} name 
         */
        Module: function(root, name) {
            var that = this;

            this.config = {};

            this.init = function () {
                //每个模块默认调用委托事件的方法
                root._delegate(that.events);
            };

            this.events = {};

            this.handles = {};

            this.pubsub = root._pubsub();

            root.pubsub.on('root.init', name, function () {
                that.init();

                that.pubsub.fire(name + '.init');
            });
        },

        /**
         * 同步加载各个模块的html
         * @param  {string} selector 选择器
         * @param  {string} url      页面地址
         */
        loadModuleHtml: function(selector, url) {
            $.ajax({
                url: url,
                cache: false,
                async: false,
                success: function (html) {
                    $(selector).append(html);
                }
            });
        },

        /**
         * 调用moduleCreateFns下的方法
         */
        _loadModuleJs: function() {
            var root = this;
            var fns = root.moduleCreateFns;

            for (var key in fns) {
                if (fns.hasOwnProperty(key)) {
                    fns[key](root);
                }
            }
        },

        /**
         * DOM事件委托，接受selector&selector的形式
         * @private
         */
        _delegate: function(events) {
            var root = this;
            var events = events || {};
            var eventObjs, fn, queryStr, type, parentNode, parentQuery, childQuery;

            for (queryStr in events) {
                if (events.hasOwnProperty(queryStr)) {
                    eventObjs = events[queryStr];
                }

                for (type in eventObjs) {
                    if (eventObjs.hasOwnProperty(type)) {
                        fn = eventObjs[type];
                        parentQuery = queryStr.split('&')[0];
                        childQuery = queryStr.split('&')[1];
                        if (parentQuery === 'window') {
                            parentNode = $(window);
                        }
                        else {
                            parentNode = $(parentQuery) || $('body');
                        }

                        if (parentQuery === childQuery) {
                            parentNode.on(type, (function (fn) {
                                return function (e) {
                                    var args = Array.prototype.slice.call(arguments, 0);
                                    var newThis = e.currentTarget;
                                    args.unshift(root);
                                    fn.apply(newThis, args);
                                };
                            })(fn));
                        }
                        else {
                            parentNode.delegate(childQuery, type, (function (fn) {
                                return function (e) {
                                    var args = Array.prototype.slice.call(arguments, 0);
                                    var newThis = e.currentTarget;
                                    args.unshift(root);
                                    fn.apply(newThis, args);
                                };
                            })(fn));
                        }
                    }
                }
            }
        },
        /**
         * 发布订阅
         * @return {[type]} [description]
         */
        _pubsub: function() {
            return {
                /**
                 *注册事件
                 *
                 * @public
                 * @param {string} [eventName] [事件名]
                 * @param {string} [listenerName] [需要添加事件的对象]
                 * @param {function()} [handler] [触发事件的相应处理函数]
                 * @return {object} [实例对象]
                 */
                on: function (eventName, listenerName, handler) {
                    if (!this._events) {
                        this._events = {};
                    }
                    if (!this._events[eventName]) {
                        this._events[eventName] = {};
                    }
                    if (this._events[eventName][listenerName] == null && typeof handler === 'function') {
                        this._events[eventName][listenerName] = handler;
                    }
                    return this;
                },

                /**
                 *触发事件
                 *
                 * @public
                 * @param {string} [eventName] [事件名，由listenerName和eventName组成]
                 * @return {object} [实例对象]
                 */
                fire: function (eventName, listenerName) {
                    if (!this._events || !this._events[eventName]) { return; }

                    var args = Array.prototype.slice.call(arguments, 2) || [];
                    var listeners = this._events[eventName];
                    if (listenerName == null) {
                        for (var key in listeners) {
                            listeners[key].apply(this, args);
                        }
                    }
                    else {
                        if (listeners.hasOwnProperty(listenerName)) {
                            listeners[listenerName].apply(this, args);
                        }
                        else {
                            return;
                        }
                    }

                    return this;
                },

                /**
                 *注销事件
                 *
                 *@public
                 *@param {string} [eventName] [事件名]
                 *@param {string} [listenerName] [需要添加事件的对象]
                 *@return {object} [实例对象]
                 */
                off: function (eventName, listenerName) {
                    if (!eventName && !listenerName) {
                        this._events = {};
                    }
                    if (eventName && !listenerName) {
                        delete this._events[eventName];
                    }

                    if (eventName && listenerName) {
                        delete this._events[eventName];
                    }
                    return this;
                }
            };
        }
    };

    //
    app.pubsub = app._pubsub();

    return app;
}