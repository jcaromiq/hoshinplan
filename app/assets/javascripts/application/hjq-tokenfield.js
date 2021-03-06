/* hjq-tokenfield */
(function($) {

        var addEmailValidation = function(that) {
                var checkErrors = function(e) {
                        var errors = $(e.target).parent().find(".token.invalid");
                        if (errors.length>0) {
                                $(e.target).closest("form").addClass("has-errors");
                        } else {
                                $(e.target).closest("form").removeClass("has-errors");
                        }
                }
                that.on('tokenfield:createdtoken', function(e) {
                        //Email without name
                        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                        //Email with name
                        var re2 = /^(?:("?(?:[^@]*)"?))?<?(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))>?$/;
                        var valid = re.test(e.attrs.value) || re2.test(e.attrs.value)
                        if (!valid) {
                                $(e.relatedTarget).addClass('invalid');
                                checkErrors(e);
                        }
                })
                
                .on('tokenfield:edittoken', function (e) {
                        checkErrors(e);
                })
                
                .on('tokenfield:removedtoken', function (e) {
                        checkErrors(e);
                });
                
        }
        
        var methods = {
                init: function(annotations) {
                        var options = this.hjq('getOptions', annotations);
                        var that = $(this);
                        for (var event in annotations.events) {
                                this.on(event, this.hjq('createFunction', annotations.events[event]));
                        }
                        // Fix autofocus until this is resolved: https://github.com/sliptree/bootstrap-tokenfield/issues/84
                        that.on("tokenfield:initialize", function(e) {
                                var input = $(that.data("bs.tokenfield").$input);
                                if (that.attr("autofocus")) {
                                        that.removeAttr("autofocus");
                                        input.attr("autofocus", "autofocus");
                                        setTimeout(function() {
                                                input.focus();
                                        }, 50);
                                }
                                
                                if (options["inputType"] == "email") {
                                        addEmailValidation(that);
                                }
                        });
                        that.tokenfield(options);
                }
        };

        $.fn.hjq_tokenfield = function(method) {
                if (methods[method]) {
                        return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
                } else if (typeof method === 'object' || !method) {
                        return methods.init.apply(this, arguments);
                } else {
                        $.error('Method ' + method + ' does not exist on hjq_tokenfield');
                }
        };

})(jQuery);
