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
$(document).ready(loadKanban);
$(window).on("popstate", loadKanban);

var loadKanban = function() {
	try {
		if ($("body.kanban.show-page").length < 1) {
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
		if (showMine != $("#show-mine").bootstrapSwitch("state")) {
			$("#show-mine").bootstrapSwitch("toggleState");
		}
		doFilterPostits(colors, showMine);
	} catch(err) {
		window.location.hash = "";
	}
}

var doFilterPostits = function(colors, showMine) {
	var selector = "";
	for (var i=0; i<colors.length; i++) {
		if (selector.length>0) {
			selector += ", ";
		}
		selector +=  ".kb-color-" + colors[i];
	}
	$(".postit").show();
	$(selector).hide();
	if (showMine) {
		var sm = $("#show-mine");
		var user = sm.data("user");
		$(".postit:not(:has(.user-" + user + "))").hide();
	}
	equalHeightSections();
}

var filterPostits = function(event) {
	event.stopPropagation();
	var clickedColor = $(event.target).data("color");
	if (clickedColor) {
		$('.col-tog-' + clickedColor).toggle();
	}
	var sm = $("#show-mine");
	var showMine = sm.bootstrapSwitch("state");
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


function updateTimer(percent) {
	$(".health-popover-toggle").popover('destroy');
	$("#health-popover").html("");
	$('.health-popover-toggle').each( function() {
		$(this).popover({
		    container: '#health-popover',
		    html: true,
		    placement: function() {return $( window ).width() < 767 ? 'bottom' : 'right auto'},
			title: function () {
			    var close = '<button type="button" class="close" data-dismiss="modal" aria-hidden="true" onclick="$(\'#health\').popover(\'hide\');$.undim();">&times;</button>';
			    return $(this).data("title") + close;
		    },
		    viewport: function(elem) {  
			    	var sel = null;
			    	var cl = elem.closest('.section').attr('class');
				if (cl) {
					sel = "." + cl.trim().replace(/\s/gi, ".");
				} 
				return {"selector": sel, "padding": "0"};
			}($(this)),
		    content: function () {
		        return $(this).next().html();
		    }
		});
	});
	$( ".health-popover-toggle" ).click(function( event ) {
	  $('.health-popover-toggle').not(this).popover('hide');
	  event.stopPropagation();
	  $("#health-popover .popover").addClass("fixed-x");
	});
	$("#tutorial").hjq_tutorial("update");
	$('body').on('keyup.dismiss.healthPopover', function (e) {
		e.which == 27 && $('.health-popover-toggle').popover('hide');
	});
	$('body').on('click.dismiss.healthPopover', function (e) {
		if ($('#health-popover div.popover:visible').length){
			$('.health-popover-toggle').popover('hide');
		}
	});
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

$(document).ready(function () {
	var msg = $("[data-rapid-page-data]").data('rapid-page-data').cookiemsg;
	var agree = $("[data-rapid-page-data]").data('rapid-page-data').agreemsg;
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
	if ($("html.pdf").length > 0) { return; }
        $("body.fixed-headers .navbar, body.fixed-headers .content-header, .fixed-x").map(function() {
		$(this).css({"margin-left": "0"}); 
		$(this).css({"width": "auto"});
		if ($(window).width() > 640) {
			$(this).css({"width": $(this).width()});
			$(this).css({"margin-left": $(window).scrollLeft()}); 
		}
	});
}


$(window).scroll(function () {
	if (typeof presenting != "undefined" && presenting) return;
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
        decSeparator = decSeparator == undefined ? "." : decSeparator,
        thouSeparator = thouSeparator == undefined ? "," : thouSeparator,
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
$(document).ready(function() {
	$("#sso-login").submit(function () {
		var val = $("#sso-login input[name=email]").val();
		var domain = document.domain.replace(/^.+?\./, '.');
		$.cookie("ssoemail", val, {domain: domain, path: '/', expires: 600});
	});

	$("#login.modal").on('shown', function() {
		var email = $.cookie("ssoemail");
		if (email != null) {
			$("#sso-login input[name=email]").val(email).focus();
		}
	});
});

(function() {
	var footer = function() {
		var fh = $(".footer").first().height();
		$("body").css("margin-bottom", fh);
	}
	$(window).resize(footer);
	$(document).ready(footer);
})();

var launchBoxSelect = function(elem) {
	var boxSelect = new BoxSelect({
	    clientId: 'xp2amwwyx7pmz2zhkco6pe351datue23',
	    linkType: 'shared',
	    multiselect: 'false'
	});
	boxSelect.success(function(response) {
		var val = '"'+response[0].name+'":'+response[0].url;
		elem.insertAtCaret(val);
	});
	boxSelect.launchPopup();
}

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
	$(".alert").css("display", "none").fadeIn(1000);
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



