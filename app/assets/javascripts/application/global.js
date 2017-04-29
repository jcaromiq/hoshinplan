var dummyVariableName = 1;
var isValidDate = function (value, userFormat) {
  var userFormat = userFormat || 'mm/dd/yyyy', // default format
  delimiter = /[^mdy]/.exec(userFormat)[0],
  theFormat = userFormat.split(delimiter),
  theDate = value.split(delimiter),

  isDate = function (date, format) {
    var m, d, y
    for (var i = 0, len = format.length; i < len; i++) {
      if (/m/.test(format[i])) m = date[i]
      if (/d/.test(format[i])) d = date[i]
      if (/y/.test(format[i])) y = date[i]
    }
    return (
      m > 0 && m < 13 &&
      y && y.length === 4 &&
      d > 0 && d <= (new Date(y, m, 0)).getDate()
    )
  }

  return isDate(theDate, theFormat)

}

var validateDate = function(formElem) {
	var inputs = $(formElem).find(".bootstrap-datepicker");
	for (var i=0; i<inputs.length; i++) {
		var inp = $(inputs[i]);
		var format = inp.attr("data-date-format");
		var value = inp.val();
		if (!isValidDate(value, format)) {
			alert("Not a valid date, the format should be: " + format);
			return false;
		}
	}
	return true;
}
var loadKanban = function() {
	try {
		if ($("#show-mine").length < 1) {
			return;
		}
		var showMine = false;
		var colors = [];
		if (window.location.hash.length > 1) {
			var h = window.location.hash.substring(1).split(";");
			if (h.length==2) {
				showMine = h[1]=="true";
				colors = h[0].split(",");
			}
		}
		$(".ic-eye").show();
		$(".ic-eye-slash").hide();
		for (i=0; i<colors.length; i++) {
			$('.col-tog-' + colors[i]).toggle();
		}
		if (showMine != $("#show-mine").prop("checked")) {
            $("#show-mine").prop("checked", !$("#show-mine").prop("checked"));
		}
		doFilterPostits(colors, showMine);
	} catch(err) {
		window.location.hash = "";
	}
}
$(document).ready(function() {
	if ($("#show-mine").length >= 1) {
		$(window).on("popstate", loadKanban);
		loadKanban();
	}
});


var doFilterPostits = function(colors, showMine) {
	var selector = "";
	for (var i=0; i<colors.length; i++) {
		if (selector.length>0) {
			selector += ", ";
		}
		selector +=  ".kb-color-" + colors[i];
	}
	$(".postit").show();
	$(".kb-not-mine").show();
	$(selector).hide();
	if (showMine) {
		var sm = $("#show-mine");
		$(".kb-not-mine").hide();
	}
	equalHeightSections();
}

var filterPostits = function() {
	window.event.stopPropagation();
	var clickedColor = $(window.event.target).data("color");
	if (clickedColor) {
		$('.col-tog-' + clickedColor).toggle();
	}
	var sm = $("#show-mine");
	var showMine = sm.prop("checked");
	var selector = "";
	var hiddenColors = [];
	$(".filter-color").each(function() {
		if ($(this).is(":hidden")) {
			var col = $(this).data("color");
			hiddenColors.push(col);
		}
	});
	window.location.hash = hiddenColors.join(",") + ";" + showMine
	return false;
}

var laneOver = function (event, ui) {
	var that = $(event.target).addClass("active");
}

var laneOut = function (event, ui) {
	var that = $(event.target).removeClass("active");
}

var postitDrop = function (event, ui) {
	var that = ui.item.closest(".sortable-collection");
	var row = ui.item.closest(".kanban-row");
	that.sortable("refresh");
	var lane = that.data("list-id");
	$form = ui.item.find(".csupdate.formlet");
	$form.find("input[name='task[status]']").val(lane);
	if (row.length > 0) {
		var objective_id = row.data("id");
		$form.find("input[name='task[objective_id]']").val(objective_id);
	}
	$form.data('rapid').formlet.form_attrs.action = "/tasks/" + ui.item.data("id");
	$form.hjq_formlet("submit");
	var annotations=that.data('rapid')['sortable-collection'];
	annotations.ajax_attrs["no_spinner"] = true
	var roptions = that.hjq('buildRequest', {type: 'post',
	                                     attrs: annotations.ajax_attrs
	                                    });
	roptions.data['authenticity_token']=$('body').find("[data-rapid-page-data]").data("rapid-page-data").form_auth_token.value;
	roptions.data=$.param(roptions.data);
	roptions.data = roptions.data+"&task_ordering=-1"
	that.children("*[data-rapid-context]").each(function(i) {
	roptions.data = roptions.data + "," + $(this).hjq('contextId') ;
	});

	$.ajax("/tasks/reorder_lane/" + lane + "/" + ui.item.hjq('contextId'), roptions);
	return that;
	equalHeightSections();
}

var dateFormat = function(format, d) {
	if (typeof d === "undefined") { // partial
        return function (d) {
              return dateFormat.apply(this, [format, d]);
        };
    }
	if (d instanceof Array) {
		var date = new Date(d[0],d[1]-1,d[2]);
	} else {
		var date = new Date(d);
	}
	var that = $(document);
	var language = document.documentElement.lang;
	var monthNamesShort = that.hjq_pickdate('languages')[language].monthsShort;
	var ret = $.datepicker.formatDate(format, date, {monthNamesShort: monthNamesShort});
	return ret;
}

function updateColors() {
	$('.kb-color').each(function () {
		var col = $(this).css('background-color');
		var colId = $(this).data('color-id');
		$(".kb-color-" + colId).css('background',col);
		var col_tr = col.replace(")",",0)").replace("rgb","rgba")
		$(".kb-color-" + colId + " .more").css('background','linear-gradient(to bottom, ' + col_tr + ', ' + col + ' 100%)');
	});
}
$(document).ready(updateColors);

var userId = '';
$(document).ready(function () {
	var msg = $("[data-rapid-page-data]").data('rapid-page-data').cookiemsg;
	var agree = $("[data-rapid-page-data]").data('rapid-page-data').agreemsg;
	userId = $("[data-rapid-page-data]").data('rapid-page-data')["user-id"];
	$.cookieCuttr({
		"cookieAnalytics": false,
		"cookieMessage": msg,
		"cookieAcceptButtonText": agree,
		"cookiePolicyLink": "/legal/cookies/"
	});
	if (!$.cookieAccepted()) {
		var h = $(".cc-cookies").first().css('height');
		$(".navbar").first().css('padding-top', h);
	}
});

function fixedHorizontal() {
    if ($("html.pdf").length > 0) {
        return;
    }
    if (typeof presenting != "undefined" && presenting) return;
    $('.popover').popover('hide');
    $("body.fixed-headers .navbar, body.fixed-headers .content-header, .fixed-x").map(function () {
        $(this).css({"margin-left": "0"});
        $(this).css({"width": "auto"});
        if ($(window).width() > 640) {
            $(this).css({"width": $(this).width()});
            $(this).css({"margin-left": $(window).scrollLeft()});
        }
    });
}



$(window).scroll(function () {
        fixedHorizontal();
});

$(document).ready( function() {

	$("ul.collection.areas").hammer().bind("swipeleft", function(event) {
		var cur = $(".carousel-indicators li.active");
		if (!cur) return;
		var it = cur.next("li");
		if (it) {
			it.click();
		}
	});

	$("ul.collection.areas").hammer().bind("swiperight", function(event) {
		var cur = $(".carousel-indicators li.active");
		if (!cur) return;
		var it = cur.prev("li");
		if (it) {
			it.click();
		}
	});

	var computeOneAreaWidth = function() {
		oneAreaWidth = $("ul.collection.areas").first().width();
		return oneAreaWidth;
	}
	var oneAreaWidth = computeOneAreaWidth();
	$(window).resize(computeOneAreaWidth);

	var updateCarouselInd = function() {
			var num = Math.floor($(this).scrollLeft() / oneAreaWidth);
			$(".carousel-indicators li").removeClass("active");
			$(".carousel-indicators li").eq(num).addClass("active");
	}
	$("ul.collection.areas").on("scroll", updateCarouselInd);
	updateCarouselInd();
	$(".carousel li").click(function() {
		$("ul.collection.areas").animate({
			scrollLeft: $(this).data("index") * oneAreaWidth,
		});
	});
	updateCarouselInd.call($("ul.collection.areas").get());
});

var eh = false;

var equalHeightSections = function() {
	if ($("html.pdf").length > 0) { return; }
	if (eh) return;
	eh = true;
	fixedHorizontal();
	equalHeights("div.objectives-wrapper");
	equalHeights("div.indicators-wrapper");
	equalHeights("div.tasks-wrapper");
    equalHeights(".area .header");
    equalHeights(".kb-lane");
	eh = false;
}
$(window).resize(equalHeightSections);
$(document).ready(equalHeightSections);
$(window).load(equalHeightSections);

var equalHeights = function(elements) {
	$(elements).height("auto");
	if (typeof presenting != "undefined" && presenting) return;
	var maxHeight = 0;
	//$(elements).css({border: "1px solid red"});
	$(elements).each(function(){
        	//$("body").append("Hola: " + $(this).parent().attr("id") + " . " + $(this).innerHeight() + "<br/>");
    		if ($(this).height() > maxHeight) {
	 	       maxHeight = $(this).height();
		}
	});
	$(elements).height(maxHeight);
	//$(elements).height("auto");
	//$("body").append("MH: " + maxHeight + "<br/>");
}

$(document).ready(function() {
	var tz = $(document).get_timezone();
	var domain = document.location.hostname.replace(/[^\.]*\./,'');
	document.cookie = "tz=" + tz+";domain="+domain+"; path=/";
});

Number.prototype.formatMoney = function(decPlaces, thouSeparator, decSeparator) {
    var n = this,
        decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces,
        decSeparator = decSeparator == undefined ? $('body').find("[data-rapid-page-data]").data("rapid-page-data").separator : decSeparator,
        thouSeparator = thouSeparator == undefined ? $('body').find("[data-rapid-page-data]").data("rapid-page-data").delimiter : thouSeparator,
        sign = n < 0 ? "-" : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
    return sign + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(n - i).toFixed(decPlaces).slice(2) : "").replace(/[\.,0]+$/,'');
};

var numberFormat = function(num) {
    var that = $(document);
    if (num == null) {
        return '';
    } else {
        var parts = num.toString().split(".");
            //parts[0] = parts[0].replace(/\\B(?=(\\d{3})+(?!\\d))/g, "#{t 'number.format.delimiter'}");
            return parts.join($('body').find("[data-rapid-page-data]").data("rapid-page-data").separator);
    }
}

String.prototype.replaceAll = function(target, replacement) {
    return this.split(target).join(replacement);
};

var parseLocalFloat = function(numstr) {
    var that = $('body').find("[data-rapid-page-data]").data("rapid-page-data");
    if (numstr == null) {
        return null;
    } else if (typeof numstr == "number") {
        return numstr;
    } else {
        numstr = numstr.replaceAll(that.delimiter, "").replaceAll(that.separator, ".");
        return parseFloat(numstr);
    }
}

var dateFormatMonth = function(d) {
	return dateFormat('M', d);
}

var dateFormatDefault = function(d) {
	var that = $(document);

	return dateFormat($('body').find("[data-rapid-page-data]").data("rapid-page-data").dateformat.replace('yyyy','yy'), d);
}

var ylabelformat = function(val, i) {
	var ret = val;
	var that = $(document);
	if (ret == null) return ret;
	if (i==3) {
		ret  = numberFormat((ret.toFixed(2) * 1).toString()) + '%';
	} else {
		ret = ret.formatMoney(2, $('body').find("[data-rapid-page-data]").data("rapid-page-data").delimiter, $('body').find("[data-rapid-page-data]").data("rapid-page-data").separator);
	}
	return ret;
}

var ylabelformatHealth = function(val, i) {
	var ret = val;
	var that = $(document);
	if (ret == null) return ret;
	ret  = numberFormat((ret.toFixed(2) * 1).toString()) + '%';
	return ret;
}
$(document).ready(function() {
	$("form.login-form").submit(function () {
		var val = $(this).find("input[name=email]").val();
		var domain = document.domain.replace(/^.+?\./, '.');
		$.cookie("ssoemail", val, {domain: domain, path: '/', expires: 600});
	});

        if ($.cookie("auth_token") != null) {
                $("body.front-page a#signup").click(function(e) {
                        $("#login.modal").modal("show");
                        e.preventDefault();
                });
        }

	$("#login.modal").on('shown.bs.modal.selectAll', function() {
		var email = $.cookie("ssoemail");
		if (email != null) {
			$(this).find("input[name=email]").val(email).focus().select();
		}
	});
});

var __loadedjs = [];
function loadJs(url, attributes, cb) {
	if (__loadedjs.indexOf(url) < 0) {
		var script = document.createElement('script');
		script.setAttribute('src', url);
		script.setAttribute('type', 'text/javascript');
		if (attributes) {
			for(att in attributes) {
				script.setAttribute(att, attributes[att]);
			}
		}
		var loaded = false;
	        var loadFunction = function () {
	          if (loaded) return;
		  __loadedjs.push(url);
	          loaded = true;
	          cb & cb();
	        };
	        script.onload = loadFunction;
	        script.onreadystatechange = loadFunction;
		document.getElementsByTagName("head")[0].appendChild(script);
	} else {
		cb & cb();
	}
};

$.fn.extend({
    insertAtCaret: function(myValue) {
	var elem = this.get(0);
        if (document.selection) {
                elem.focus();
                sel = document.selection.createRange();
                sel.text = myValue;
                elem.focus();
        }
        else if (elem.selectionStart || elem.selectionStart == '0') {
            var startPos = elem.selectionStart;
            var endPos = elem.selectionEnd;
            var scrollTop = elem.scrollTop;
            elem.value = elem.value.substring(0, startPos)+myValue+elem.value.substring(endPos,elem.value.length);
            elem.focus();
            elem.selectionStart = startPos + myValue.length;
            elem.selectionEnd = startPos + myValue.length;
            elem.scrollTop = scrollTop;
        } else {
            elem.value += myValue;
            elem.focus();
        }
    }
});

var openPostit = function(elem) {
	$(elem).prevAll('.postit-description').toggleClass('show-all');
	$(elem).toggleClass('open');
	window.setTimeout(equalHeightSections, 1100);
}


$(document).ready(function() {
	$('.modal').on('hidden.bs.modal', function (e) {
		$('body').removeClass("modal-open");
	});
	window.setTimeout(function() {
	    $(".alert.alert-info,.alert.alert-success").fadeTo(1500, 0).slideUp(500, function(){
	        $(this).remove();
	    });
	}, 8000);
});

var _urq = _urq || [];
$(document).ready(function() {
	var language = document.documentElement.lang;
	var site = "c990b744-a088-4aaa-8414-51217a5cfa9a";
	if (language == "es") {
		site = "64daf682-b7c5-40ba-8fe3-aeb24ec7f4c2";
	}
	_urq.push(['setGACode', 'UA-47284244-1']);
	_urq.push(['initSite', site]);
});

var areas = {};
$(document).ready(function() {
	$(".area.card .hoshin-link").each(function() {
		var elem = $(this).closest(".area.card").find("h4.heading");
		var link = elem.find("a[href='" + this.href + "']");
		if (link.length < 1) {
			elem.append(' <a href="'+this.href+'" title="'+this.title +'" class="child-hoshin-link"><span class="ic-child"></span></a>');
		}
	});

});

$(document).ready(function() {
	var append = $("#to-append").children();
	if (append.length > 0) {
		$(".kb-frame.dots .connected-sortable-wrapper .kb-lane").append(append);
	}
});

var tooltips = function() {
   $('[data-toggle=tooltip]').tooltip();
};
$(document).ready(tooltips);
$(window).bind('page:change', tooltips);

var mapImpactFilterEnable = function() {
	if (location.hash.startsWith("#min-")) {
		var value = parseInt(location.hash.substr(5));
		$(this).bootstrapSlider('setValue', value);
		$(this).trigger("change");
	}
};

var mapImpactFilterChange = function(event) {
	var min = parseInt($(this).attr("data-value"));
	$(".dot").each(function() {
		var that = $(this);
		var impact = parseInt(that.data("impact"));
		if (min <= impact) {
			that.show();
		} else {
			that.hide();
		}
	});
}

var mapImpactFilterAnchor = function() {
	var min = parseInt($(this).attr("data-value"));
	location.hash = '#min-' + min;
}

var isInputFocused = function() {
	return $.inArray($(document.activeElement)[0].tagName, ["INPUT", "SELECT", "TEXTAREA"]) >= 0;
}
var isModalShown = function() {
	return $(".modal").toArray().reduce(function(a,b) { return (($(b).data('bs.modal') || {}).isShown) || a }, false);
}

$(document).ready(function() {
	if (typeof(numeral) == "undefined") {
		return;
	}
	// load a language
	numeral.language('es', {
	    delimiters: {
	        thousands: '.',
	        decimal: ','
	    },
	    abbreviations: {
	        thousand: 'K',
	        million: 'M',
	        billion: 'B',
	        trillion: 'T'
	    },
	    ordinal : function (number) {
	        return 'o';
	    },
	    currency: {
	        symbol: '€'
	    }
	});

	// switch between languages
	numeral.language(document.documentElement.lang);
});

function addAreaUpdate(elem) {
	var that = $(elem);
	that.closest("form").data('rapid').form.ajax_attrs.updates += ",#area-" + elem.value;
}

$(window).load(function () {
	if (userId && typeof mixpanel === "object" && typeof mixpanel.identify === "function") {
		mixpanel.identify(userId);
	}
});


if (document.body.classList.contains('tr-hd')) {
    var header = $(".navbar-default");
    var start = $( window ).height() / 2;
    var range = $( window ).height() / 4;

    $(window).on('scroll', function() {
        var scrollTop = $(this).scrollTop() - start;
        if (scrollTop < 0) scrollTop = 0;
        /* avoid unnecessary call to jQuery function */
        if (scrollTop <= range+start) {
            header.css({ 'background-color' : 'rgba(29,44,65, ' + scrollTop/range + ')'});
        }
    });
}

if (document.body.classList.contains('tr-hd')) {
    var header = $(".navbar-default");
    var start = $( window ).height() / 2;
    var range = $( window ).height() / 4;

    $(window).on('scroll', function() {
        var scrollTop = $(this).scrollTop() - start;
        if (scrollTop < 0) scrollTop = 0;
        /* avoid unnecessary call to jQuery function */
        if (scrollTop <= range+start) {
            header.css({ 'background-color' : 'rgba(29,44,65, ' + scrollTop/range + ')'});
        }
    });
}

$(document).on('rapid:ajax:success', function() {
    $.material.init();
});

$(document).ready(function() {
    $.material.init();
});