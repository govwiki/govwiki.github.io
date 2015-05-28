(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var add_marker, bounds_timeout, clear, create_info_window, geocode, geocode_addr, get_icon, get_records, get_records2, map, on_bounds_changed, on_bounds_changed_later, pinImage;

bounds_timeout = void 0;

map = new GMaps({
  el: '#govmap',
  lat: 37.3789008,
  lng: -117.1916283,
  zoom: 6,
  scrollwheel: false,
  panControl: false,
  zoomControl: true,
  zoomControlOptions: {
    style: google.maps.ZoomControlStyle.SMALL
  },
  bounds_changed: function() {
    return on_bounds_changed_later(200);
  }
});

on_bounds_changed_later = function(msec) {
  clearTimeout(bounds_timeout);
  return bounds_timeout = setTimeout(on_bounds_changed, msec);
};

on_bounds_changed = function(e) {
  var b, ne, ne_lat, ne_lng, q2, st, sw, sw_lat, sw_lng, ty, url_value;
  console.log("bounds_changed");
  b = map.getBounds();
  url_value = b.toUrlValue();
  ne = b.getNorthEast();
  sw = b.getSouthWest();
  ne_lat = ne.lat();
  ne_lng = ne.lng();
  sw_lat = sw.lat();
  sw_lng = sw.lng();
  st = GOVWIKI.state_filter;
  ty = GOVWIKI.gov_type_filter;

  /*
   * Build the query.
  q=""" "latitude":{"$lt":#{ne_lat},"$gt":#{sw_lat}},"longitude":{"$lt":#{ne_lng},"$gt":#{sw_lng}}"""
   * Add filters if they exist
  q+=""","state":"#{st}" """ if st
  q+=""","gov_type":"#{ty}" """ if ty
  
  
  get_records q, 200,  (data) ->
    #console.log "length=#{data.length}"
    #console.log "lat: #{ne_lat},#{sw_lat} lng: #{ne_lng}, #{sw_lng}"
    map.removeMarkers()
    add_marker(rec) for rec in data
    return
   */
  q2 = " latitude<" + ne_lat + " AND latitude>" + sw_lat + " AND longitude<" + ne_lng + " AND longitude>" + sw_lng + " ";
  if (st) {
    q2 += " AND state=\"" + st + "\" ";
  }
  if (ty) {
    q2 += " AND gov_type=\"" + ty + "\" ";
  }
  return get_records2(q2, 200, function(data) {
    var i, len, rec, ref;
    map.removeMarkers();
    ref = data.record;
    for (i = 0, len = ref.length; i < len; i++) {
      rec = ref[i];
      add_marker(rec);
    }
  });
};

get_icon = function(gov_type) {
  var _circle;
  _circle = function(color) {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillOpacity: 0.5,
      fillColor: color,
      strokeWeight: 1,
      strokeColor: 'white',
      scale: 6
    };
  };
  switch (gov_type) {
    case 'General Purpose':
      return _circle('#03C');
    case 'Cemeteries':
      return _circle('#000');
    case 'Hospitals':
      return _circle('#0C0');
    default:
      return _circle('#D20');
  }
};

add_marker = function(rec) {
  map.addMarker({
    lat: rec.latitude,
    lng: rec.longitude,
    icon: get_icon(rec.gov_type),
    title: rec.gov_name + ", " + rec.gov_type + " (" + rec.latitude + ", " + rec.longitude + ")",
    infoWindow: {
      content: create_info_window(rec)
    },
    click: function(e) {
      return window.GOVWIKI.show_record2(rec);
    }
  });
};

create_info_window = function(r) {
  var w;
  w = $('<div></div>').append($("<a href='#'><strong>" + r.gov_name + "</strong></a>").click(function(e) {
    e.preventDefault();
    console.log(r);
    return window.GOVWIKI.show_record2(r);
  })).append($("<div> " + r.gov_type + "  " + r.city + " " + r.zip + " " + r.state + "</div>"));
  return w[0];
};

get_records = function(query, limit, onsuccess) {
  return $.ajax({
    url: "https://api.mongolab.com/api/1/databases/govwiki/collections/govs/?q={" + query + "}&f={_id:0}&l=" + limit + "&s={rand:1}&apiKey=0Y5X_Qk2uOJRdHJWJKSRWk6l6JqVTS2y",
    dataType: 'json',
    cache: true,
    success: onsuccess,
    error: function(e) {
      return console.log(e);
    }
  });
};

get_records2 = function(query, limit, onsuccess) {
  return $.ajax({
    url: "http://46.101.3.79:80/rest/db/govs",
    data: {
      filter: query,
      fields: "_id,inc_id,gov_name,gov_type,city,zip,state,latitude,longitude",
      app_name: "govwiki",
      order: "rand",
      limit: limit
    },
    dataType: 'json',
    cache: true,
    success: onsuccess,
    error: function(e) {
      return console.log(e);
    }
  });
};

pinImage = new google.maps.MarkerImage('http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=Z|7777BB|FFFFFF', new google.maps.Size(21, 34), new google.maps.Point(0, 0), new google.maps.Point(10, 34));

geocode_addr = function(addr, data) {
  return GMaps.geocode({
    address: addr,
    callback: function(results, status) {
      var latlng;
      if (status === 'OK') {
        latlng = results[0].geometry.location;
        map.setCenter(latlng.lat(), latlng.lng());
        map.addMarker({
          lat: latlng.lat(),
          lng: latlng.lng(),
          size: 'small',
          title: results[0].formatted_address,
          infoWindow: {
            content: results[0].formatted_address
          }
        });
        if (data) {
          map.addMarker({
            lat: data.latitude,
            lng: data.longitude,
            size: 'small',
            color: 'blue',
            icon: pinImage,
            title: data.latitude + " " + data.longitude,
            infoWindow: {
              content: data.latitude + " " + data.longitude
            }
          });
        }
        $('.govmap-found').html("<strong>FOUND: </strong>" + results[0].formatted_address);
      }
    }
  });
};

clear = function(s) {
  if (s.match(/ box /i)) {
    return '';
  } else {
    return s;
  }
};

geocode = function(data) {
  var addr;
  addr = (clear(data.address1)) + " " + (clear(data.address2)) + ", " + data.city + ", " + data.state + " " + data.zip + ", USA";
  $('#govaddress').val(addr);
  return geocode_addr(addr, data);
};

module.exports = {
  geocode: geocode,
  gocode_addr: geocode_addr,
  on_bounds_changed: on_bounds_changed,
  on_bounds_changed_later: on_bounds_changed_later
};



},{}],2:[function(require,module,exports){
var GovSelector, query_matcher,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

query_matcher = require('./querymatcher.coffee');

GovSelector = (function() {
  var entered_value, govs_array;

  GovSelector.prototype.on_selected = function(evt, data, name) {};

  function GovSelector(html_selector, docs_url, num_items) {
    this.html_selector = html_selector;
    this.num_items = num_items;
    this.startSuggestion = bind(this.startSuggestion, this);
    $.ajax({
      url: docs_url,
      dataType: 'json',
      cache: true,
      success: this.startSuggestion
    });
  }

  GovSelector.prototype.suggestionTemplate = Handlebars.compile("<div class=\"sugg-box\">\n  <div class=\"sugg-state\">{{{state}}}</div>\n  <div class=\"sugg-name\">{{{gov_name}}}</div>\n  <div class=\"sugg-type\">{{{gov_type}}}</div>\n</div>");

  entered_value = "";

  govs_array = [];

  GovSelector.prototype.count_govs = function() {
    var count, d, i, len, ref;
    count = 0;
    ref = this.govs_array;
    for (i = 0, len = ref.length; i < len; i++) {
      d = ref[i];
      if (GOVWIKI.state_filter && d.state !== GOVWIKI.state_filter) {
        continue;
      }
      if (GOVWIKI.gov_type_filter && d.gov_type !== GOVWIKI.gov_type_filter) {
        continue;
      }
      count++;
    }
    return count;
  };

  GovSelector.prototype.startSuggestion = function(govs) {
    this.govs_array = govs.record;
    $('.typeahead').keyup((function(_this) {
      return function(event) {
        return _this.entered_value = $(event.target).val();
      };
    })(this));
    $(this.html_selector).attr('placeholder', 'GOVERNMENT NAME');
    $(this.html_selector).typeahead({
      hint: false,
      highlight: false,
      minLength: 1
    }, {
      name: 'gov_name',
      displayKey: 'gov_name',
      source: query_matcher(this.govs_array, this.num_items),
      templates: {
        suggestion: this.suggestionTemplate
      }
    }).on('typeahead:selected', (function(_this) {
      return function(evt, data, name) {
        $('.typeahead').typeahead('val', _this.entered_value);
        return _this.on_selected(evt, data, name);
      };
    })(this)).on('typeahead:cursorchanged', (function(_this) {
      return function(evt, data, name) {
        return $('.typeahead').val(_this.entered_value);
      };
    })(this));
    $('.gov-counter').text(this.count_govs());
  };

  return GovSelector;

})();

module.exports = GovSelector;



},{"./querymatcher.coffee":4}],3:[function(require,module,exports){

/*
file: main.coffe -- The entry -----------------------------------------------------------------------------------
  :
gov_finder = new GovFinder
gov_details = new GovDetails
gov_finder.on_select = gov_details.show
-----------------------------------------------------------------------------------------------------------------
 */
var GovSelector, Templates2, activate_tab, active_tab, adjust_typeahead_width, build_select_element, build_selector, focus_search_field, get_elected_officials, get_record, get_record2, gov_selector, govmap, livereload, start_adjusting_typeahead_width, templates;

GovSelector = require('./govselector.coffee');

Templates2 = require('./templates2.coffee');

govmap = require('./govmap.coffee');

window.GOVWIKI = {
  state_filter: '',
  gov_type_filter: '',
  show_search_page: function() {
    $(window).scrollTo('0px', 10);
    $('#dataContainer').hide();
    $('#searchIcon').hide();
    $('#searchContainer').fadeIn(300);
    return focus_search_field(500);
  },
  show_data_page: function() {
    $(window).scrollTo('0px', 10);
    $('#searchIcon').show();
    $('#dataContainer').fadeIn(300);
    return $('#searchContainer').hide();
  }
};

gov_selector = new GovSelector('.typeahead', 'data/h_types_ca.json', 7);

templates = new Templates2;

active_tab = "";

window.remember_tab = function(name) {
  return active_tab = name;
};

$(document).on('click', '#fieldTabs a', function(e) {
  active_tab = $(e.currentTarget).data('tabname');
  console.log(active_tab);
  $("#tabsContent .tab-pane").removeClass("active");
  $($(e.currentTarget).attr('href')).addClass("active");
  return templates.activate(0, active_tab);
});

activate_tab = function() {
  return $("#fieldTabs a[href='#tab" + active_tab + "']").tab('show');
};

gov_selector.on_selected = function(evt, data, name) {
  return get_elected_officials(data._id, 25, function(data2, textStatus, jqXHR) {
    data.elected_officials = data2;
    $('#details').html(templates.get_html(0, data));
    get_record2(data["_id"]);
    activate_tab();
    GOVWIKI.show_data_page();
  });
};

get_record = function(query) {
  return $.ajax({
    url: "https://api.mongolab.com/api/1/databases/govwiki/collections/govs/?q={" + query + "}&f={_id:0}&l=1&apiKey=0Y5X_Qk2uOJRdHJWJKSRWk6l6JqVTS2y",
    dataType: 'json',
    cache: true,
    success: function(data) {
      if (data.length) {
        $('#details').html(templates.get_html(0, data[0]));
        activate_tab();
      }
    },
    error: function(e) {
      return console.log(e);
    }
  });
};

get_record2 = function(recid) {
  return $.ajax({
    url: "http://46.101.3.79:80/rest/db/govs/" + recid,
    dataType: 'json',
    headers: {
      "X-DreamFactory-Application-Name": "govwiki"
    },
    cache: true,
    success: function(data) {
      if (data) {
        get_elected_officials(data._id, 25, function(data2, textStatus, jqXHR) {
          data.elected_officials = data2;
          $('#details').html(templates.get_html(0, data));
          return activate_tab();
        });
      }
    },
    error: function(e) {
      return console.log(e);
    }
  });
};

get_elected_officials = function(gov_id, limit, onsuccess) {
  return $.ajax({
    url: "http://46.101.3.79:80/rest/db/elected_officials",
    data: {
      filter: "govs_id=" + gov_id,
      fields: "govs_id,title,full_name,email_address,photo_url,term_expires",
      app_name: "govwiki",
      order: "display_order",
      limit: limit
    },
    dataType: 'json',
    cache: true,
    success: onsuccess,
    error: function(e) {
      return console.log(e);
    }
  });
};

window.GOVWIKI.show_record = (function(_this) {
  return function(rec) {
    $('#details').html(templates.get_html(0, rec));
    activate_tab();
    return GOVWIKI.show_data_page();
  };
})(this);

window.GOVWIKI.show_record2 = (function(_this) {
  return function(rec) {
    return get_elected_officials(rec._id, 25, function(data, textStatus, jqXHR) {
      rec.elected_officials = data;
      $('#details').html(templates.get_html(0, rec));
      get_record2(rec._id);
      activate_tab();
      return GOVWIKI.show_data_page();
    });
  };
})(this);


/*
window.show_rec = (rec)->
  $('#details').html templates.get_html(0, rec)
  activate_tab()
 */

build_selector = function(container, text, command, where_to_store_value) {
  return $.ajax({
    url: 'https://api.mongolab.com/api/1/databases/govwiki/runCommand?apiKey=0Y5X_Qk2uOJRdHJWJKSRWk6l6JqVTS2y',
    type: 'POST',
    contentType: "application/json",
    dataType: 'json',
    data: command,
    cache: true,
    success: (function(_this) {
      return function(data) {
        var values;
        values = data.values;
        build_select_element(container, text, values.sort(), where_to_store_value);
      };
    })(this),
    error: function(e) {
      return console.log(e);
    }
  });
};

build_select_element = function(container, text, arr, where_to_store_value) {
  var i, len, s, select, v;
  s = "<select class='form-control' style='maxwidth:160px;'><option value=''>" + text + "</option>";
  for (i = 0, len = arr.length; i < len; i++) {
    v = arr[i];
    if (v) {
      s += "<option value='" + v + "'>" + v + "</option>";
    }
  }
  s += "</select>";
  select = $(s);
  $(container).append(select);
  if (text === 'State..') {
    select.val('CA');
    window.GOVWIKI.state_filter = 'CA';
    govmap.on_bounds_changed_later();
  }
  return select.change(function(e) {
    var el;
    el = $(e.target);
    window.GOVWIKI[where_to_store_value] = el.val();
    $('.gov-counter').text(gov_selector.count_govs());
    return govmap.on_bounds_changed();
  });
};

adjust_typeahead_width = function() {
  var inp, par;
  inp = $('#myinput');
  par = $('#typeahed-container');
  return inp.width(par.width());
};

start_adjusting_typeahead_width = function() {
  return $(window).resize(function() {
    return adjust_typeahead_width();
  });
};

livereload = function(port) {
  var url;
  url = window.location.origin.replace(/:[^:]*$/, "");
  return $.getScript(url + ":" + port, (function(_this) {
    return function() {
      return $('body').append("<div style='position:absolute;z-index:1000;\nwidth:100%; top:0;color:red; text-align: center; \npadding:1px;font-size:10px;line-height:1'>live</div>");
    };
  })(this));
};

focus_search_field = function(msec) {
  return setTimeout((function() {
    return $('#myinput').focus();
  }), msec);
};

templates.load_fusion_template("tabs", "https://www.googleapis.com/fusiontables/v2/query?sql=SELECT%20*%20FROM%201z2oXQEYQ3p2OoMI8V5gKgHWB5Tz990BrQ1xc1tVo&key=AIzaSyCXDQyMDpGA2g3Qjuv4CDv7zRj-ix4IQJA");

build_selector('.state-container', 'State..', '{"distinct": "govs","key":"state"}', 'state_filter');

build_selector('.gov-type-container', 'type of government..', '{"distinct": "govs","key":"gov_type"}', 'gov_type_filter');

adjust_typeahead_width();

start_adjusting_typeahead_width();

$('#btnBackToSearch').click(function(e) {
  e.preventDefault();
  return GOVWIKI.show_search_page();
});

livereload("9090");



},{"./govmap.coffee":1,"./govselector.coffee":2,"./templates2.coffee":5}],4:[function(require,module,exports){
var QueryMather, full_trim, get_words, get_words_regs, select_text, strip, strongify;

QueryMather = function(docs, num_items) {
  if (num_items == null) {
    num_items = 5;
  }
  return function(q, cb) {
    var d, j, len, matches, ref, regs, test_string, words;
    test_string = function(s, regs) {
      var j, len, r;
      for (j = 0, len = regs.length; j < len; j++) {
        r = regs[j];
        if (!r.test(s)) {
          return false;
        }
      }
      return true;
    };
    ref = get_words_regs(q), words = ref[0], regs = ref[1];
    matches = [];
    for (j = 0, len = docs.length; j < len; j++) {
      d = docs[j];
      if (matches.length >= num_items) {
        break;
      }
      if (GOVWIKI.state_filter && d.state !== GOVWIKI.state_filter) {
        continue;
      }
      if (GOVWIKI.gov_type_filter && d.gov_type !== GOVWIKI.gov_type_filter) {
        continue;
      }
      if (test_string(d.gov_name, regs)) {
        matches.push($.extend({}, d));
      }
    }
    select_text(matches, words, regs);
    cb(matches);
  };
};

select_text = function(clones, words, regs) {
  var d, j, len;
  for (j = 0, len = clones.length; j < len; j++) {
    d = clones[j];
    d.gov_name = strongify(d.gov_name, words, regs);
  }
  return clones;
};

strongify = function(s, words, regs) {
  regs.forEach(function(r, i) {
    return s = s.replace(r, "<b>" + words[i] + "</b>");
  });
  return s;
};

strip = function(s) {
  return s.replace(/<[^<>]*>/g, '');
};

full_trim = function(s) {
  var ss;
  ss = s.trim('' + s);
  return ss = ss.replace(/ +/g, ' ');
};

get_words = function(str) {
  return full_trim(str).split(' ');
};

get_words_regs = function(str) {
  var regs, words;
  words = get_words(str);
  regs = words.map(function(w) {
    return new RegExp("" + w, 'ig');
  });
  return [words, regs];
};

module.exports = QueryMather;



},{}],5:[function(require,module,exports){

/*
 * file: templates2.coffee ----------------------------------------------------------------------
#
 * Class to manage templates and render data on html page.
#
 * The main method : render(data), get_html(data)
#-------------------------------------------------------------------------------------------------
 */
var Templates2, add_other_tab_to_layout, convert_fusion_template, fieldNames, get_layout_fields, get_record_fields, get_unmentioned_fields, render_field, render_field_name, render_field_value, render_fields, render_tabs, under;

fieldNames = {};

render_field_value = function(n, data) {
  var v;
  v = data[n];
  if (!data[n]) {
    return '';
  }
  if (n === "web_site") {
    return "<a target='_blank' href='" + v + "'>" + v + "</a>";
  } else {
    return v;
  }
};

render_field_name = function(fName) {
  var s;
  if (fieldNames[fName] != null) {
    return fieldNames[fName];
  }
  s = fName.replace(/_/g, " ");
  s = s.charAt(0).toUpperCase() + s.substring(1);
  return s;
};

render_field = function(fName, data) {
  var fValue;
  if ("_" === substr(fName, 0, 1)) {
    return "<div>\n    <span class='f-nam'>" + (render_field_name(fName)) + "</span>\n    <span class='f-val'>&nbsp;</span>\n</div>";
  } else {
    if (!(fValue = data[fName])) {
      return '';
    }
    return "<div>\n    <span class='f-nam'>" + (render_field_name(fName)) + "</span>\n    <span class='f-val'>" + (render_field_value(fName, data)) + "</span>\n</div>";
  }
};

render_fields = function(fields, data, template) {
  var fName, fValue, field, h, i, j, len;
  h = '';
  for (i = j = 0, len = fields.length; j < len; i = ++j) {
    field = fields[i];
    fValue = render_field_value(field, data);
    if ('' !== fValue) {
      fName = render_field_name(field);
      h += template({
        name: fName,
        value: fValue
      });
    }
  }
  return h;
};

under = function(s) {
  return s.replace(/[\s\+\-]/g, '_');
};

render_tabs = function(initial_layout, data, tabset, parent) {
  var detail_data, h, i, j, layout, layout_data, len, len1, len2, m, o, official, official_data, plot_handles, ref, tab, templates;
  layout = initial_layout;
  templates = parent.templates;
  plot_handles = {};
  layout_data = {
    title: data.gov_name,
    tabs: [],
    tabcontent: ''
  };
  for (i = j = 0, len = layout.length; j < len; i = ++j) {
    tab = layout[i];
    layout_data.tabs.push({
      tabid: under(tab.name),
      tabname: tab.name,
      active: (i > 0 ? '' : 'active')
    });
  }
  for (i = m = 0, len1 = layout.length; m < len1; i = ++m) {
    tab = layout[i];
    detail_data = {
      tabid: under(tab.name),
      tabname: tab.name,
      active: (i > 0 ? '' : 'active'),
      tabcontent: ''
    };
    switch (tab.name) {
      case 'Overview + Elected Officials':
        detail_data.tabcontent += render_fields(tab.fields, data, templates['tabdetail-namevalue-template']);
        ref = data.elected_officials.record;
        for (i = o = 0, len2 = ref.length; o < len2; i = ++o) {
          official = ref[i];
          official_data = {
            title: '' !== official.title ? "Title: " + official.title : '',
            name: '' !== official.full_name ? "Name: " + official.full_name : '',
            email: '' !== official.email_address ? "Email: " + official.email_address : '',
            termexpires: '' !== official.term_expires ? "Term Expires: " + official.term_expires : ''
          };
          if ('' !== official.photo_url) {
            official_data.image = '<img src="' + official.photo_url + '" alt="" />';
          }
          detail_data.tabcontent += templates['tabdetail-official-template'](official_data);
        }
        break;
      case 'Employee Compensation':
        h = '';
        h += render_fields(tab.fields, data, templates['tabdetail-namevalue-template']);
        detail_data.tabcontent += templates['tabdetail-employee-comp-template']({
          content: h
        });
        tabset.bind(tab.name, function(tpl_name, data) {
          var options, plot_data_bottom, plot_data_top, plot_spec;
          options = {
            xaxis: {
              minTickSize: 2
            },
            series: {
              bars: {
                show: true,
                barWidth: .9,
                align: "center"
              }
            }
          };
          if (!plot_handles['median-comp-graph']) {
            options.xaxis.ticks = [[1, "Median Total Gov. Comp"], [2, "Median Total Individual Comp"]];
            plot_spec = [];
            plot_data_bottom = [[1, data['median_total_comp_per_ft_emp'] / data['median_total_comp_over_median_individual_comp']], [2, data['median_total_comp_per_ft_emp']]];
            plot_data_top = [[], []];
            plot_spec.push({
              data: plot_data_bottom
            });

            /*
            plot_spec.push
              data: plot_data_top
             */
            plot_handles['median-comp-graph'] = $("#median-comp-graph").plot(plot_spec, options);
          }
          if (!plot_handles['median-pension-graph']) {
            options.xaxis.ticks = [[1, "Median Pension for Retiree w/ 30 Years"], [2, "Median Total Individual Comp"]];
            plot_spec = [];
            plot_data_bottom = [[1, data['median_pension_30_year_retiree']], [2, data['median_earnings']]];
            plot_data_top = [[], []];
            plot_spec.push({
              data: plot_data_bottom
            });

            /*
            plot_spec.push
              data: plot_data_top
             */
            plot_handles['median-pension-graph'] = $("#median-pension-graph").plot(plot_spec, options);
          }
          if (false) {
            plot_spec = [];
            plot_data_bottom = [[], []];
            plot_data_top = [[], []];
            plot_spec.push({
              data: plot_data_bottom,
              label: "Pension & OPEB (req'd) as % of total revenue"
            });

            /*
            plot_spec.push
              data: plot_data_top
              label: "Median Total Individual Comp"
             */
            return plot_handles['pct-pension-graph'] = $("#pct-pension-graph").plot(plot_spec, options);
          }
        });
        break;
      default:
        detail_data.tabcontent += render_fields(tab.fields, data, templates['tabdetail-namevalue-template']);
    }
    layout_data.tabcontent += templates['tabdetail-template'](detail_data);
  }
  return templates['tabpanel-template'](layout_data);
};

get_layout_fields = function(la) {
  var f, field, j, len, len1, m, ref, t;
  f = {};
  for (j = 0, len = la.length; j < len; j++) {
    t = la[j];
    ref = t.fields;
    for (m = 0, len1 = ref.length; m < len1; m++) {
      field = ref[m];
      f[field] = 1;
    }
  }
  return f;
};

get_record_fields = function(r) {
  var f, field_name;
  f = {};
  for (field_name in r) {
    f[field_name] = 1;
  }
  return f;
};

get_unmentioned_fields = function(la, r) {
  var f, layout_fields, record_fields, unmentioned_fields;
  layout_fields = get_layout_fields(la);
  record_fields = get_record_fields(r);
  unmentioned_fields = [];
  for (f in record_fields) {
    if (!layout_fields[f]) {
      unmentioned_fields.push(f);
    }
  }
  return unmentioned_fields;
};

add_other_tab_to_layout = function(layout, data) {
  var l, t;
  if (layout == null) {
    layout = [];
  }
  l = $.extend(true, [], layout);
  t = {
    name: "Other",
    fields: get_unmentioned_fields(l, data)
  };
  l.push(t);
  return l;
};

convert_fusion_template = function(templ) {
  var categories, category, col_hash, field, fieldname, fields, get_col_hash, hash_to_array, i, j, len, len1, len2, len3, m, newFields, o, obj, p, placeholder_count, ref, ref1, row, tab_hash, tabs, val;
  tab_hash = {};
  tabs = [];
  get_col_hash = function(columns) {
    var col_hash, col_name, i, j, len, ref;
    col_hash = {};
    ref = templ.columns;
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      col_name = ref[i];
      col_hash[col_name] = i;
    }
    return col_hash;
  };
  val = function(field_name, fields, col_hash) {
    return fields[col_hash[field_name]];
  };
  hash_to_array = function(hash) {
    var a, k, tab;
    a = [];
    for (k in hash) {
      tab = {};
      tab.name = k;
      tab.fields = hash[k];
      a.push(tab);
    }
    return a;
  };
  col_hash = get_col_hash(templ.col_hash);
  placeholder_count = 0;
  ref = templ.rows;
  for (i = j = 0, len = ref.length; j < len; i = ++j) {
    row = ref[i];
    category = val('general_category', row, col_hash);
    fieldname = val('field_name', row, col_hash);
    if (!fieldname) {
      fieldname = "_" + String(++placeholder_count);
    }
    fieldNames[val('field_name', row, col_hash)] = val('description', row, col_hash);
    if (category) {
      if (tab_hash[category] == null) {
        tab_hash[category] = [];
      }
      tab_hash[category].push({
        n: val('n', row, col_hash),
        name: fieldname
      });
    }
  }
  categories = Object.keys(tab_hash);
  for (m = 0, len1 = categories.length; m < len1; m++) {
    category = categories[m];
    fields = [];
    ref1 = tab_hash[category];
    for (o = 0, len2 = ref1.length; o < len2; o++) {
      obj = ref1[o];
      fields.push(obj);
    }
    fields.sort(function(a, b) {
      return a.n - b.n;
    });
    newFields = [];
    for (p = 0, len3 = fields.length; p < len3; p++) {
      field = fields[p];
      newFields.push(field.name);
    }
    tab_hash[category] = newFields;
  }
  tabs = hash_to_array(tab_hash);
  return tabs;
};

Templates2 = (function() {
  Templates2.list = void 0;

  Templates2.templates = void 0;

  Templates2.data = void 0;

  Templates2.events = void 0;

  function Templates2() {
    var i, j, len, len1, m, template, templateList, templatePartials;
    this.list = [];
    this.events = {};
    templateList = ['tabpanel-template', 'tabdetail-template', 'tabdetail-namevalue-template', 'tabdetail-official-template', 'tabdetail-employee-comp-template'];
    templatePartials = ['tab-template'];
    this.templates = {};
    for (i = j = 0, len = templateList.length; j < len; i = ++j) {
      template = templateList[i];
      this.templates[template] = Handlebars.compile($('#' + template).html());
    }
    for (i = m = 0, len1 = templatePartials.length; m < len1; i = ++m) {
      template = templatePartials[i];
      Handlebars.registerPartial(template, $('#' + template).html());
    }
  }

  Templates2.prototype.add_template = function(layout_name, layout_json) {
    return this.list.push({
      parent: this,
      name: layout_name,
      render: function(dat) {
        this.parent.data = dat;
        return render_tabs(layout_json, dat, this, this.parent);
      },
      bind: function(tpl_name, callback) {
        if (!this.parent.events[tpl_name]) {
          return this.parent.events[tpl_name] = [callback];
        } else {
          return this.parent.events[tpl_name].push(callback);
        }
      },
      activate: function(tpl_name) {
        var e, i, j, len, ref, results;
        if (this.parent.events[tpl_name]) {
          ref = this.parent.events[tpl_name];
          results = [];
          for (i = j = 0, len = ref.length; j < len; i = ++j) {
            e = ref[i];
            results.push(e(tpl_name, this.parent.data));
          }
          return results;
        }
      }
    });
  };

  Templates2.prototype.load_template = function(template_name, url) {
    return $.ajax({
      url: url,
      dataType: 'json',
      cache: true,
      success: (function(_this) {
        return function(template_json) {
          _this.add_template(template_name, template_json);
        };
      })(this)
    });
  };

  Templates2.prototype.load_fusion_template = function(template_name, url) {
    return $.ajax({
      url: url,
      dataType: 'json',
      cache: true,
      success: (function(_this) {
        return function(template_json) {
          var t;
          t = convert_fusion_template(template_json);
          _this.add_template(template_name, t);
        };
      })(this)
    });
  };

  Templates2.prototype.get_names = function() {
    var j, len, ref, results, t;
    ref = this.list;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      t = ref[j];
      results.push(t.name);
    }
    return results;
  };

  Templates2.prototype.get_index_by_name = function(name) {
    var i, j, len, ref, t;
    ref = this.list;
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      t = ref[i];
      if (t.name === name) {
        return i;
      }
    }
    return -1;
  };

  Templates2.prototype.get_html = function(ind, data) {
    if (ind === -1) {
      return "";
    }
    if (this.list[ind]) {
      return this.list[ind].render(data);
    } else {
      return "";
    }
  };

  Templates2.prototype.activate = function(ind, tpl_name) {
    if (this.list[ind]) {
      return this.list[ind].activate(tpl_name);
    }
  };

  return Templates2;

})();

module.exports = Templates2;



},{}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJDOlxcd3d3cm9vdFxcZ292d2lraS1kZXYudXNcXGNvZmZlZVxcZ292bWFwLmNvZmZlZSIsIkM6XFx3d3dyb290XFxnb3Z3aWtpLWRldi51c1xcY29mZmVlXFxnb3ZzZWxlY3Rvci5jb2ZmZWUiLCJDOlxcd3d3cm9vdFxcZ292d2lraS1kZXYudXNcXGNvZmZlZVxcbWFpbi5jb2ZmZWUiLCJDOlxcd3d3cm9vdFxcZ292d2lraS1kZXYudXNcXGNvZmZlZVxccXVlcnltYXRjaGVyLmNvZmZlZSIsIkM6XFx3d3dyb290XFxnb3Z3aWtpLWRldi51c1xcY29mZmVlXFx0ZW1wbGF0ZXMyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLElBQUEsNEtBQUE7O0FBQUEsY0FBQSxHQUFlLE1BQWYsQ0FBQTs7QUFBQSxHQUdBLEdBQVUsSUFBQSxLQUFBLENBQ1I7QUFBQSxFQUFBLEVBQUEsRUFBSSxTQUFKO0FBQUEsRUFDQSxHQUFBLEVBQUssVUFETDtBQUFBLEVBRUEsR0FBQSxFQUFLLENBQUEsV0FGTDtBQUFBLEVBR0EsSUFBQSxFQUFLLENBSEw7QUFBQSxFQUlBLFdBQUEsRUFBYSxLQUpiO0FBQUEsRUFLQSxVQUFBLEVBQVksS0FMWjtBQUFBLEVBTUEsV0FBQSxFQUFhLElBTmI7QUFBQSxFQU9BLGtCQUFBLEVBQ0U7QUFBQSxJQUFBLEtBQUEsRUFBTyxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQXBDO0dBUkY7QUFBQSxFQVNBLGNBQUEsRUFBZ0IsU0FBQSxHQUFBO1dBQ2QsdUJBQUEsQ0FBd0IsR0FBeEIsRUFEYztFQUFBLENBVGhCO0NBRFEsQ0FIVixDQUFBOztBQUFBLHVCQWlCQSxHQUEyQixTQUFDLElBQUQsR0FBQTtBQUN6QixFQUFBLFlBQUEsQ0FBYSxjQUFiLENBQUEsQ0FBQTtTQUNBLGNBQUEsR0FB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QU8sQ0FBQSxDQUFQLENBSmdCO0VBQUEsQ0F4RG5CLENBQUE7O0FBQUEsdUJBOERBLFFBQUEsR0FBVSxTQUFDLEdBQUQsRUFBTSxJQUFOLEdBQUE7QUFDUixJQUFBLElBQUksR0FBQSxLQUFPLENBQUEsQ0FBWDtBQUFvQixhQUFRLEVBQVIsQ0FBcEI7S0FBQTtBQUVBLElBQUEsSUFBRyxJQUFDLENBQUEsSUFBSyxDQUFBLEdBQUEsQ0FBVDtBQUNFLGFBQU8sSUFBQyxDQUFBLElBQUssQ0FBQSxHQUFBLENBQUksQ0FBQyxNQUFYLENBQWtCLElBQWxCLENBQVAsQ0FERjtLQUFBLE1BQUE7QUFHRSxhQUFPLEVBQVAsQ0FIRjtLQUhRO0VBQUEsQ0E5RFYsQ0FBQTs7QUFBQSx1QkFzRUEsUUFBQSxHQUFVLFNBQUMsR0FBRCxFQUFNLFFBQU4sR0FBQTtBQUNSLElBQUEsSUFBRyxJQUFDLENBQUEsSUFBSyxDQUFBLEdBQUEsQ0FBVDthQUNFLElBQUMsQ0FBQSxJQUFLLENBQUEsR0FBQSxDQUFJLENBQUMsUUFBWCxDQUFvQixRQUFwQixFQURGO0tBRFE7RUFBQSxDQXRFVixDQUFBOztvQkFBQTs7SUF4UEYsQ0FBQTs7QUFBQSxNQWtVTSxDQUFDLE9BQVAsR0FBaUIsVUFsVWpCLENBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiYm91bmRzX3RpbWVvdXQ9dW5kZWZpbmVkXHJcblxyXG5cclxubWFwID0gbmV3IEdNYXBzXHJcbiAgZWw6ICcjZ292bWFwJ1xyXG4gIGxhdDogMzcuMzc4OTAwOFxyXG4gIGxuZzogLTExNy4xOTE2MjgzXHJcbiAgem9vbTo2XHJcbiAgc2Nyb2xsd2hlZWw6IGZhbHNlXHJcbiAgcGFuQ29udHJvbDogZmFsc2VcclxuICB6b29tQ29udHJvbDogdHJ1ZVxyXG4gIHpvb21Db250cm9sT3B0aW9uczpcclxuICAgIHN0eWxlOiBnb29nbGUubWFwcy5ab29tQ29udHJvbFN0eWxlLlNNQUxMXHJcbiAgYm91bmRzX2NoYW5nZWQ6IC0+XHJcbiAgICBvbl9ib3VuZHNfY2hhbmdlZF9sYXRlciAyMDBcclxuXHJcblxyXG5vbl9ib3VuZHNfY2hhbmdlZF9sYXRlciAgPSAobXNlYykgIC0+XHJcbiAgY2xlYXJUaW1lb3V0IGJvdW5kc190aW1lb3V0XHJcbiAgYm91bmRzX3RpbWVvdXQgPSBzZXRUaW1lb3V0IG9uX2JvdW5kc19jaGFuZ2VkLCBtc2VjXHJcblxyXG4gICAgXHJcbm9uX2JvdW5kc19jaGFuZ2VkID0oZSkgLT5cclxuICBjb25zb2xlLmxvZyBcImJvdW5kc19jaGFuZ2VkXCJcclxuICBiPW1hcC5nZXRCb3VuZHMoKVxyXG4gIHVybF92YWx1ZT1iLnRvVXJsVmFsdWUoKVxyXG4gIG5lPWIuZ2V0Tm9ydGhFYXN0KClcclxuICBzdz1iLmdldFNvdXRoV2VzdCgpXHJcbiAgbmVfbGF0PW5lLmxhdCgpXHJcbiAgbmVfbG5nPW5lLmxuZygpXHJcbiAgc3dfbGF0PXN3LmxhdCgpXHJcbiAgc3dfbG5nPXN3LmxuZygpXHJcbiAgc3QgPSBHT1ZXSUtJLnN0YXRlX2ZpbHRlclxyXG4gIHR5ID0gR09WV0lLSS5nb3ZfdHlwZV9maWx0ZXJcclxuXHJcbiAgIyMjXHJcbiAgIyBCdWlsZCB0aGUgcXVlcnkuXHJcbiAgcT1cIlwiXCIgXCJsYXRpdHVkZVwiOntcIiRsdFwiOiN7bmVfbGF0fSxcIiRndFwiOiN7c3dfbGF0fX0sXCJsb25naXR1ZGVcIjp7XCIkbHRcIjoje25lX2xuZ30sXCIkZ3RcIjoje3N3X2xuZ319XCJcIlwiXHJcbiAgIyBBZGQgZmlsdGVycyBpZiB0aGV5IGV4aXN0XHJcbiAgcSs9XCJcIlwiLFwic3RhdGVcIjpcIiN7c3R9XCIgXCJcIlwiIGlmIHN0XHJcbiAgcSs9XCJcIlwiLFwiZ292X3R5cGVcIjpcIiN7dHl9XCIgXCJcIlwiIGlmIHR5XHJcblxyXG5cclxuICBnZXRfcmVjb3JkcyBxLCAyMDAsICAoZGF0YSkgLT5cclxuICAgICNjb25zb2xlLmxvZyBcImxlbmd0aD0je2RhdGEubGVuZ3RofVwiXHJcbiAgICAjY29uc29sZS5sb2cgXCJsYXQ6ICN7bmVfbGF0fSwje3N3X2xhdH0gbG5nOiAje25lX2xuZ30sICN7c3dfbG5nfVwiXHJcbiAgICBtYXAucmVtb3ZlTWFya2VycygpXHJcbiAgICBhZGRfbWFya2VyKHJlYykgZm9yIHJlYyBpbiBkYXRhXHJcbiAgICByZXR1cm5cclxuICAjIyNcclxuXHJcbiAgIyBCdWlsZCB0aGUgcXVlcnkgMi5cclxuICBxMj1cIlwiXCIgbGF0aXR1ZGU8I3tuZV9sYXR9IEFORCBsYXRpdHVkZT4je3N3X2xhdH0gQU5EIGxvbmdpdHVkZTwje25lX2xuZ30gQU5EIGxvbmdpdHVkZT4je3N3X2xuZ30gXCJcIlwiXHJcbiAgIyBBZGQgZmlsdGVycyBpZiB0aGV5IGV4aXN0XHJcbiAgcTIrPVwiXCJcIiBBTkQgc3RhdGU9XCIje3N0fVwiIFwiXCJcIiBpZiBzdFxyXG4gIHEyKz1cIlwiXCIgQU5EIGdvdl90eXBlPVwiI3t0eX1cIiBcIlwiXCIgaWYgdHlcclxuXHJcblxyXG4gIGdldF9yZWNvcmRzMiBxMiwgMjAwLCAgKGRhdGEpIC0+XHJcbiAgICAjY29uc29sZS5sb2cgXCJsZW5ndGg9I3tkYXRhLmxlbmd0aH1cIlxyXG4gICAgI2NvbnNvbGUubG9nIFwibGF0OiAje25lX2xhdH0sI3tzd19sYXR9IGxuZzogI3tuZV9sbmd9LCAje3N3X2xuZ31cIlxyXG4gICAgbWFwLnJlbW92ZU1hcmtlcnMoKVxyXG4gICAgYWRkX21hcmtlcihyZWMpIGZvciByZWMgaW4gZGF0YS5yZWNvcmRcclxuICAgIHJldHVyblxyXG5cclxuXHJcblxyXG5nZXRfaWNvbiA9KGdvdl90eXBlKSAtPlxyXG4gIFxyXG4gIF9jaXJjbGUgPShjb2xvciktPlxyXG4gICAgcGF0aDogZ29vZ2xlLm1hcHMuU3ltYm9sUGF0aC5DSVJDTEVcclxuICAgIGZpbGxPcGFjaXR5OiAwLjVcclxuICAgIGZpbGxDb2xvcjpjb2xvclxyXG4gICAgc3Ryb2tlV2VpZ2h0OiAxXHJcbiAgICBzdHJva2VDb2xvcjond2hpdGUnXHJcbiAgICAjc3Ryb2tlUG9zaXRpb246IGdvb2dsZS5tYXBzLlN0cm9rZVBvc2l0aW9uLk9VVFNJREVcclxuICAgIHNjYWxlOjZcclxuXHJcbiAgc3dpdGNoIGdvdl90eXBlXHJcbiAgICB3aGVuICdHZW5lcmFsIFB1cnBvc2UnIHRoZW4gcmV0dXJuIF9jaXJjbGUgJyMwM0MnXHJcbiAgICB3aGVuICdDZW1ldGVyaWVzJyAgICAgIHRoZW4gcmV0dXJuIF9jaXJjbGUgJyMwMDAnXHJcbiAgICB3aGVuICdIb3NwaXRhbHMnICAgICAgIHRoZW4gcmV0dXJuIF9jaXJjbGUgJyMwQzAnXHJcbiAgICBlbHNlIHJldHVybiBfY2lyY2xlICcjRDIwJ1xyXG5cclxuXHJcblxyXG5cclxuYWRkX21hcmtlciA9KHJlYyktPlxyXG4gICNjb25zb2xlLmxvZyBcIiN7cmVjLnJhbmR9ICN7cmVjLmluY19pZH0gI3tyZWMuemlwfSAje3JlYy5sYXRpdHVkZX0gI3tyZWMubG9uZ2l0dWRlfSAje3JlYy5nb3ZfbmFtZX1cIlxyXG4gIG1hcC5hZGRNYXJrZXJcclxuICAgIGxhdDogcmVjLmxhdGl0dWRlXHJcbiAgICBsbmc6IHJlYy5sb25naXR1ZGVcclxuICAgIGljb246IGdldF9pY29uKHJlYy5nb3ZfdHlwZSlcclxuICAgIHRpdGxlOiAgXCIje3JlYy5nb3ZfbmFtZX0sICN7cmVjLmdvdl90eXBlfSAoI3tyZWMubGF0aXR1ZGV9LCAje3JlYy5sb25naXR1ZGV9KVwiXHJcbiAgICBpbmZvV2luZG93OlxyXG4gICAgICBjb250ZW50OiBjcmVhdGVfaW5mb193aW5kb3cgcmVjXHJcbiAgICBjbGljazogKGUpLT5cclxuICAgICAgI3dpbmRvdy5HT1ZXSUtJLnNob3dfcmVjb3JkIHJlY1xyXG4gICAgICB3aW5kb3cuR09WV0lLSS5zaG93X3JlY29yZDIgcmVjXHJcbiAgXHJcbiAgcmV0dXJuXHJcblxyXG5cclxuY3JlYXRlX2luZm9fd2luZG93ID0ocikgLT5cclxuICB3ID0gJCgnPGRpdj48L2Rpdj4nKVxyXG4gIC5hcHBlbmQgJChcIjxhIGhyZWY9JyMnPjxzdHJvbmc+I3tyLmdvdl9uYW1lfTwvc3Ryb25nPjwvYT5cIikuY2xpY2sgKGUpLT5cclxuICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgY29uc29sZS5sb2cgclxyXG4gICAgI3dpbmRvdy5HT1ZXSUtJLnNob3dfcmVjb3JkIHJcclxuICAgIHdpbmRvdy5HT1ZXSUtJLnNob3dfcmVjb3JkMiByXHJcblxyXG4gIC5hcHBlbmQgJChcIjxkaXY+ICN7ci5nb3ZfdHlwZX0gICN7ci5jaXR5fSAje3IuemlwfSAje3Iuc3RhdGV9PC9kaXY+XCIpXHJcbiAgcmV0dXJuIHdbMF1cclxuXHJcblxyXG5cclxuXHJcbmdldF9yZWNvcmRzID0gKHF1ZXJ5LCBsaW1pdCwgb25zdWNjZXNzKSAtPlxyXG4gICQuYWpheFxyXG4gICAgdXJsOiBcImh0dHBzOi8vYXBpLm1vbmdvbGFiLmNvbS9hcGkvMS9kYXRhYmFzZXMvZ292d2lraS9jb2xsZWN0aW9ucy9nb3ZzLz9xPXsje3F1ZXJ5fX0mZj17X2lkOjB9Jmw9I3tsaW1pdH0mcz17cmFuZDoxfSZhcGlLZXk9MFk1WF9RazJ1T0pSZEhKV0pLU1JXazZsNkpxVlRTMnlcIlxyXG4gICAgZGF0YVR5cGU6ICdqc29uJ1xyXG4gICAgY2FjaGU6IHRydWVcclxuICAgIHN1Y2Nlc3M6IG9uc3VjY2Vzc1xyXG4gICAgZXJyb3I6KGUpIC0+XHJcbiAgICAgIGNvbnNvbGUubG9nIGVcclxuXHJcblxyXG5nZXRfcmVjb3JkczIgPSAocXVlcnksIGxpbWl0LCBvbnN1Y2Nlc3MpIC0+XHJcbiAgJC5hamF4XHJcbiAgICB1cmw6XCJodHRwOi8vNDYuMTAxLjMuNzk6ODAvcmVzdC9kYi9nb3ZzXCJcclxuICAgIGRhdGE6XHJcbiAgICAgICNmaWx0ZXI6XCJsYXRpdHVkZT4zMiBBTkQgbGF0aXR1ZGU8MzQgQU5EIGxvbmdpdHVkZT4tODcgQU5EIGxvbmdpdHVkZTwtODZcIlxyXG4gICAgICBmaWx0ZXI6cXVlcnlcclxuICAgICAgZmllbGRzOlwiX2lkLGluY19pZCxnb3ZfbmFtZSxnb3ZfdHlwZSxjaXR5LHppcCxzdGF0ZSxsYXRpdHVkZSxsb25naXR1ZGVcIlxyXG4gICAgICBhcHBfbmFtZTpcImdvdndpa2lcIlxyXG4gICAgICBvcmRlcjpcInJhbmRcIlxyXG4gICAgICBsaW1pdDpsaW1pdFxyXG5cclxuICAgIGRhdGFUeXBlOiAnanNvbidcclxuICAgIGNhY2hlOiB0cnVlXHJcbiAgICBzdWNjZXNzOiBvbnN1Y2Nlc3NcclxuICAgIGVycm9yOihlKSAtPlxyXG4gICAgICBjb25zb2xlLmxvZyBlXHJcblxyXG4jIEdFT0NPRElORyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG5waW5JbWFnZSA9IG5ldyAoZ29vZ2xlLm1hcHMuTWFya2VySW1hZ2UpKFxyXG4gICdodHRwOi8vY2hhcnQuYXBpcy5nb29nbGUuY29tL2NoYXJ0P2Noc3Q9ZF9tYXBfcGluX2xldHRlciZjaGxkPVp8Nzc3N0JCfEZGRkZGRicgLFxyXG4gIG5ldyAoZ29vZ2xlLm1hcHMuU2l6ZSkoMjEsIDM0KSxcclxuICBuZXcgKGdvb2dsZS5tYXBzLlBvaW50KSgwLCAwKSxcclxuICBuZXcgKGdvb2dsZS5tYXBzLlBvaW50KSgxMCwgMzQpXHJcbiAgKVxyXG5cclxuXHJcbmdlb2NvZGVfYWRkciA9IChhZGRyLGRhdGEpIC0+XHJcbiAgR01hcHMuZ2VvY29kZVxyXG4gICAgYWRkcmVzczogYWRkclxyXG4gICAgY2FsbGJhY2s6IChyZXN1bHRzLCBzdGF0dXMpIC0+XHJcbiAgICAgIGlmIHN0YXR1cyA9PSAnT0snXHJcbiAgICAgICAgbGF0bG5nID0gcmVzdWx0c1swXS5nZW9tZXRyeS5sb2NhdGlvblxyXG4gICAgICAgIG1hcC5zZXRDZW50ZXIgbGF0bG5nLmxhdCgpLCBsYXRsbmcubG5nKClcclxuICAgICAgICBtYXAuYWRkTWFya2VyXHJcbiAgICAgICAgICBsYXQ6IGxhdGxuZy5sYXQoKVxyXG4gICAgICAgICAgbG5nOiBsYXRsbmcubG5nKClcclxuICAgICAgICAgIHNpemU6ICdzbWFsbCdcclxuICAgICAgICAgIHRpdGxlOiByZXN1bHRzWzBdLmZvcm1hdHRlZF9hZGRyZXNzXHJcbiAgICAgICAgICBpbmZvV2luZG93OlxyXG4gICAgICAgICAgICBjb250ZW50OiByZXN1bHRzWzBdLmZvcm1hdHRlZF9hZGRyZXNzXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgZGF0YVxyXG4gICAgICAgICAgbWFwLmFkZE1hcmtlclxyXG4gICAgICAgICAgICBsYXQ6IGRhdGEubGF0aXR1ZGVcclxuICAgICAgICAgICAgbG5nOiBkYXRhLmxvbmdpdHVkZVxyXG4gICAgICAgICAgICBzaXplOiAnc21hbGwnXHJcbiAgICAgICAgICAgIGNvbG9yOiAnYmx1ZSdcclxuICAgICAgICAgICAgaWNvbjogcGluSW1hZ2VcclxuICAgICAgICAgICAgdGl0bGU6ICBcIiN7ZGF0YS5sYXRpdHVkZX0gI3tkYXRhLmxvbmdpdHVkZX1cIlxyXG4gICAgICAgICAgICBpbmZvV2luZG93OlxyXG4gICAgICAgICAgICAgIGNvbnRlbnQ6IFwiI3tkYXRhLmxhdGl0dWRlfSAje2RhdGEubG9uZ2l0dWRlfVwiXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICQoJy5nb3ZtYXAtZm91bmQnKS5odG1sIFwiPHN0cm9uZz5GT1VORDogPC9zdHJvbmc+I3tyZXN1bHRzWzBdLmZvcm1hdHRlZF9hZGRyZXNzfVwiXHJcbiAgICAgIHJldHVyblxyXG5cclxuXHJcbmNsZWFyPShzKS0+XHJcbiAgcmV0dXJuIGlmIHMubWF0Y2goLyBib3ggL2kpIHRoZW4gJycgZWxzZSBzXHJcblxyXG5nZW9jb2RlID0gKGRhdGEpIC0+XHJcbiAgYWRkciA9IFwiI3tjbGVhcihkYXRhLmFkZHJlc3MxKX0gI3tjbGVhcihkYXRhLmFkZHJlc3MyKX0sICN7ZGF0YS5jaXR5fSwgI3tkYXRhLnN0YXRlfSAje2RhdGEuemlwfSwgVVNBXCJcclxuICAkKCcjZ292YWRkcmVzcycpLnZhbChhZGRyKVxyXG4gIGdlb2NvZGVfYWRkciBhZGRyLCBkYXRhXHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPVxyXG4gIGdlb2NvZGU6IGdlb2NvZGVcclxuICBnb2NvZGVfYWRkcjogZ2VvY29kZV9hZGRyXHJcbiAgb25fYm91bmRzX2NoYW5nZWQ6IG9uX2JvdW5kc19jaGFuZ2VkXHJcbiAgb25fYm91bmRzX2NoYW5nZWRfbGF0ZXI6IG9uX2JvdW5kc19jaGFuZ2VkX2xhdGVyXHJcbiIsIlxyXG5xdWVyeV9tYXRjaGVyID0gcmVxdWlyZSgnLi9xdWVyeW1hdGNoZXIuY29mZmVlJylcclxuXHJcbmNsYXNzIEdvdlNlbGVjdG9yXHJcbiAgXHJcbiAgIyBzdHViIG9mIGEgY2FsbGJhY2sgdG8gZW52b2tlIHdoZW4gdGhlIHVzZXIgc2VsZWN0cyBzb21ldGhpbmdcclxuICBvbl9zZWxlY3RlZDogKGV2dCwgZGF0YSwgbmFtZSkgLT5cclxuXHJcblxyXG4gIGNvbnN0cnVjdG9yOiAoQGh0bWxfc2VsZWN0b3IsIGRvY3NfdXJsLCBAbnVtX2l0ZW1zKSAtPlxyXG4gICAgJC5hamF4XHJcbiAgICAgIHVybDogZG9jc191cmxcclxuICAgICAgZGF0YVR5cGU6ICdqc29uJ1xyXG4gICAgICBjYWNoZTogdHJ1ZVxyXG4gICAgICBzdWNjZXNzOiBAc3RhcnRTdWdnZXN0aW9uXHJcbiAgICAgIFxyXG5cclxuXHJcblxyXG4gIHN1Z2dlc3Rpb25UZW1wbGF0ZSA6IEhhbmRsZWJhcnMuY29tcGlsZShcIlwiXCJcclxuICAgIDxkaXYgY2xhc3M9XCJzdWdnLWJveFwiPlxyXG4gICAgICA8ZGl2IGNsYXNzPVwic3VnZy1zdGF0ZVwiPnt7e3N0YXRlfX19PC9kaXY+XHJcbiAgICAgIDxkaXYgY2xhc3M9XCJzdWdnLW5hbWVcIj57e3tnb3ZfbmFtZX19fTwvZGl2PlxyXG4gICAgICA8ZGl2IGNsYXNzPVwic3VnZy10eXBlXCI+e3t7Z292X3R5cGV9fX08L2Rpdj5cclxuICAgIDwvZGl2PlwiXCJcIilcclxuXHJcblxyXG5cclxuICBlbnRlcmVkX3ZhbHVlID0gXCJcIlxyXG5cclxuICBnb3ZzX2FycmF5ID0gW11cclxuXHJcbiAgY291bnRfZ292cyA6ICgpIC0+XHJcbiAgICBjb3VudCA9MFxyXG4gICAgZm9yIGQgaW4gQGdvdnNfYXJyYXlcclxuICAgICAgaWYgR09WV0lLSS5zdGF0ZV9maWx0ZXIgYW5kIGQuc3RhdGUgaXNudCBHT1ZXSUtJLnN0YXRlX2ZpbHRlciB0aGVuIGNvbnRpbnVlXHJcbiAgICAgIGlmIEdPVldJS0kuZ292X3R5cGVfZmlsdGVyIGFuZCBkLmdvdl90eXBlIGlzbnQgR09WV0lLSS5nb3ZfdHlwZV9maWx0ZXIgdGhlbiBjb250aW51ZVxyXG4gICAgICBjb3VudCsrXHJcbiAgICByZXR1cm4gY291bnRcclxuXHJcblxyXG4gIHN0YXJ0U3VnZ2VzdGlvbiA6IChnb3ZzKSA9PlxyXG4gICAgI0Bnb3ZzX2FycmF5ID0gZ292c1xyXG4gICAgQGdvdnNfYXJyYXkgPSBnb3ZzLnJlY29yZFxyXG4gICAgJCgnLnR5cGVhaGVhZCcpLmtleXVwIChldmVudCkgPT5cclxuICAgICAgQGVudGVyZWRfdmFsdWUgPSAkKGV2ZW50LnRhcmdldCkudmFsKClcclxuICAgIFxyXG4gICAgJChAaHRtbF9zZWxlY3RvcikuYXR0ciAncGxhY2Vob2xkZXInLCAnR09WRVJOTUVOVCBOQU1FJ1xyXG4gICAgJChAaHRtbF9zZWxlY3RvcikudHlwZWFoZWFkKFxyXG4gICAgICAgIGhpbnQ6IGZhbHNlXHJcbiAgICAgICAgaGlnaGxpZ2h0OiBmYWxzZVxyXG4gICAgICAgIG1pbkxlbmd0aDogMVxyXG4gICAgICAsXHJcbiAgICAgICAgbmFtZTogJ2dvdl9uYW1lJ1xyXG4gICAgICAgIGRpc3BsYXlLZXk6ICdnb3ZfbmFtZSdcclxuICAgICAgICBzb3VyY2U6IHF1ZXJ5X21hdGNoZXIoQGdvdnNfYXJyYXksIEBudW1faXRlbXMpXHJcbiAgICAgICAgI3NvdXJjZTogYmxvb2Rob3VuZC50dEFkYXB0ZXIoKVxyXG4gICAgICAgIHRlbXBsYXRlczogc3VnZ2VzdGlvbjogQHN1Z2dlc3Rpb25UZW1wbGF0ZVxyXG4gICAgKVxyXG4gICAgLm9uICd0eXBlYWhlYWQ6c2VsZWN0ZWQnLCAgKGV2dCwgZGF0YSwgbmFtZSkgPT5cclxuICAgICAgICAkKCcudHlwZWFoZWFkJykudHlwZWFoZWFkICd2YWwnLCBAZW50ZXJlZF92YWx1ZVxyXG4gICAgICAgIEBvbl9zZWxlY3RlZChldnQsIGRhdGEsIG5hbWUpXHJcbiAgIFxyXG4gICAgLm9uICd0eXBlYWhlYWQ6Y3Vyc29yY2hhbmdlZCcsIChldnQsIGRhdGEsIG5hbWUpID0+XHJcbiAgICAgICAgJCgnLnR5cGVhaGVhZCcpLnZhbCBAZW50ZXJlZF92YWx1ZVxyXG4gICAgXHJcblxyXG4gICAgJCgnLmdvdi1jb3VudGVyJykudGV4dCBAY291bnRfZ292cygpXHJcbiAgICByZXR1cm5cclxuXHJcblxyXG5cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cz1Hb3ZTZWxlY3RvclxyXG5cclxuXHJcblxyXG4iLCIjIyNcclxuZmlsZTogbWFpbi5jb2ZmZSAtLSBUaGUgZW50cnkgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICA6XHJcbmdvdl9maW5kZXIgPSBuZXcgR292RmluZGVyXHJcbmdvdl9kZXRhaWxzID0gbmV3IEdvdkRldGFpbHNcclxuZ292X2ZpbmRlci5vbl9zZWxlY3QgPSBnb3ZfZGV0YWlscy5zaG93XHJcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiMjI1xyXG5cclxuR292U2VsZWN0b3IgPSByZXF1aXJlICcuL2dvdnNlbGVjdG9yLmNvZmZlZSdcclxuI19qcWdzICAgICAgID0gcmVxdWlyZSAnLi9qcXVlcnkuZ292c2VsZWN0b3IuY29mZmVlJ1xyXG5UZW1wbGF0ZXMyICAgICAgPSByZXF1aXJlICcuL3RlbXBsYXRlczIuY29mZmVlJ1xyXG5nb3ZtYXAgICAgICA9IHJlcXVpcmUgJy4vZ292bWFwLmNvZmZlZSdcclxuI3Njcm9sbHRvID0gcmVxdWlyZSAnLi4vYm93ZXJfY29tcG9uZW50cy9qcXVlcnkuc2Nyb2xsVG8vanF1ZXJ5LnNjcm9sbFRvLmpzJ1xyXG5cclxud2luZG93LkdPVldJS0kgPVxyXG4gIHN0YXRlX2ZpbHRlciA6ICcnXHJcbiAgZ292X3R5cGVfZmlsdGVyIDogJydcclxuXHJcbiAgc2hvd19zZWFyY2hfcGFnZTogKCkgLT5cclxuICAgICQod2luZG93KS5zY3JvbGxUbygnMHB4JywxMClcclxuICAgICQoJyNkYXRhQ29udGFpbmVyJykuaGlkZSgpXHJcbiAgICAkKCcjc2VhcmNoSWNvbicpLmhpZGUoKVxyXG4gICAgJCgnI3NlYXJjaENvbnRhaW5lcicpLmZhZGVJbigzMDApXHJcbiAgICBmb2N1c19zZWFyY2hfZmllbGQgNTAwXHJcbiAgICBcclxuICBzaG93X2RhdGFfcGFnZTogKCkgLT5cclxuICAgICQod2luZG93KS5zY3JvbGxUbygnMHB4JywxMClcclxuICAgICQoJyNzZWFyY2hJY29uJykuc2hvdygpXHJcbiAgICAkKCcjZGF0YUNvbnRhaW5lcicpLmZhZGVJbigzMDApXHJcbiAgICAkKCcjc2VhcmNoQ29udGFpbmVyJykuaGlkZSgpXHJcbiAgICAjJCh3aW5kb3cpLnNjcm9sbFRvKCcjcEJhY2tUb1NlYXJjaCcsNjAwKVxyXG5cclxuXHJcblxyXG5cclxuI2dvdl9zZWxlY3RvciA9IG5ldyBHb3ZTZWxlY3RvciAnLnR5cGVhaGVhZCcsICdkYXRhL2hfdHlwZXMuanNvbicsIDdcclxuZ292X3NlbGVjdG9yID0gbmV3IEdvdlNlbGVjdG9yICcudHlwZWFoZWFkJywgJ2RhdGEvaF90eXBlc19jYS5qc29uJywgN1xyXG4jZ292X3NlbGVjdG9yID0gbmV3IEdvdlNlbGVjdG9yICcudHlwZWFoZWFkJywgJ2h0dHA6Ly80Ni4xMDEuMy43OS9yZXN0L2RiL2dvdnM/ZmlsdGVyPXN0YXRlPSUyMkNBJTIyJmFwcF9uYW1lPWdvdndpa2kmZmllbGRzPV9pZCxnb3ZfbmFtZSxnb3ZfdHlwZSxzdGF0ZScsIDdcclxudGVtcGxhdGVzID0gbmV3IFRlbXBsYXRlczJcclxuYWN0aXZlX3RhYj1cIlwiXHJcblxyXG53aW5kb3cucmVtZW1iZXJfdGFiID0obmFtZSktPiBhY3RpdmVfdGFiID0gbmFtZVxyXG5cclxuI3dpbmRvdy5nZW9jb2RlX2FkZHIgPSAoaW5wdXRfc2VsZWN0b3IpLT4gZ292bWFwLmdvY29kZV9hZGRyICQoaW5wdXRfc2VsZWN0b3IpLnZhbCgpXHJcblxyXG4kKGRvY3VtZW50KS5vbiAnY2xpY2snLCAnI2ZpZWxkVGFicyBhJywgKGUpIC0+XHJcbiAgYWN0aXZlX3RhYiA9ICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCd0YWJuYW1lJylcclxuICBjb25zb2xlLmxvZyBhY3RpdmVfdGFiXHJcbiAgJChcIiN0YWJzQ29udGVudCAudGFiLXBhbmVcIikucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIilcclxuICAkKCQoZS5jdXJyZW50VGFyZ2V0KS5hdHRyKCdocmVmJykpLmFkZENsYXNzKFwiYWN0aXZlXCIpXHJcbiAgdGVtcGxhdGVzLmFjdGl2YXRlIDAsIGFjdGl2ZV90YWJcclxuXHJcbmFjdGl2YXRlX3RhYiA9KCkgLT5cclxuICAkKFwiI2ZpZWxkVGFicyBhW2hyZWY9JyN0YWIje2FjdGl2ZV90YWJ9J11cIikudGFiKCdzaG93JylcclxuXHJcblxyXG5nb3Zfc2VsZWN0b3Iub25fc2VsZWN0ZWQgPSAoZXZ0LCBkYXRhLCBuYW1lKSAtPlxyXG4gICNyZW5kZXJEYXRhICcjZGV0YWlscycsIGRhdGFcclxuICBnZXRfZWxlY3RlZF9vZmZpY2lhbHMgZGF0YS5faWQsIDI1LCAoZGF0YTIsIHRleHRTdGF0dXMsIGpxWEhSKSAtPlxyXG4gICAgZGF0YS5lbGVjdGVkX29mZmljaWFscyA9IGRhdGEyXHJcbiAgICAkKCcjZGV0YWlscycpLmh0bWwgdGVtcGxhdGVzLmdldF9odG1sKDAsIGRhdGEpXHJcbiAgICAjZ2V0X3JlY29yZCBcImluY19pZDoje2RhdGFbXCJpbmNfaWRcIl19XCJcclxuICAgIGdldF9yZWNvcmQyIGRhdGFbXCJfaWRcIl1cclxuICAgIGFjdGl2YXRlX3RhYigpXHJcbiAgICBHT1ZXSUtJLnNob3dfZGF0YV9wYWdlKClcclxuICAgIHJldHVyblxyXG5cclxuXHJcbmdldF9yZWNvcmQgPSAocXVlcnkpIC0+XHJcbiAgJC5hamF4XHJcbiAgICB1cmw6IFwiaHR0cHM6Ly9hcGkubW9uZ29sYWIuY29tL2FwaS8xL2RhdGFiYXNlcy9nb3Z3aWtpL2NvbGxlY3Rpb25zL2dvdnMvP3E9eyN7cXVlcnl9fSZmPXtfaWQ6MH0mbD0xJmFwaUtleT0wWTVYX1FrMnVPSlJkSEpXSktTUldrNmw2SnFWVFMyeVwiXHJcbiAgICBkYXRhVHlwZTogJ2pzb24nXHJcbiAgICBjYWNoZTogdHJ1ZVxyXG4gICAgc3VjY2VzczogKGRhdGEpIC0+XHJcbiAgICAgIGlmIGRhdGEubGVuZ3RoXHJcbiAgICAgICAgJCgnI2RldGFpbHMnKS5odG1sIHRlbXBsYXRlcy5nZXRfaHRtbCgwLCBkYXRhWzBdKVxyXG4gICAgICAgIGFjdGl2YXRlX3RhYigpXHJcbiAgICAgICAgI2dvdm1hcC5nZW9jb2RlIGRhdGFbMF1cclxuICAgICAgcmV0dXJuXHJcbiAgICBlcnJvcjooZSkgLT5cclxuICAgICAgY29uc29sZS5sb2cgZVxyXG5cclxuXHJcbmdldF9yZWNvcmQyID0gKHJlY2lkKSAtPlxyXG4gICQuYWpheFxyXG4gICAgI3VybDogXCJodHRwczovL2RzcC1nb3Z3aWtpLmNsb3VkLmRyZWFtZmFjdG9yeS5jb206NDQzL3Jlc3QvZ292d2lraV9hcGkvZ292cy8je3JlY2lkfVwiXHJcbiAgICB1cmw6IFwiaHR0cDovLzQ2LjEwMS4zLjc5OjgwL3Jlc3QvZGIvZ292cy8je3JlY2lkfVwiXHJcbiAgICBkYXRhVHlwZTogJ2pzb24nXHJcbiAgICBoZWFkZXJzOiB7XCJYLURyZWFtRmFjdG9yeS1BcHBsaWNhdGlvbi1OYW1lXCI6XCJnb3Z3aWtpXCJ9XHJcbiAgICBjYWNoZTogdHJ1ZVxyXG4gICAgc3VjY2VzczogKGRhdGEpIC0+XHJcbiAgICAgIGlmIGRhdGFcclxuICAgICAgICBnZXRfZWxlY3RlZF9vZmZpY2lhbHMgZGF0YS5faWQsIDI1LCAoZGF0YTIsIHRleHRTdGF0dXMsIGpxWEhSKSAtPlxyXG4gICAgICAgICAgZGF0YS5lbGVjdGVkX29mZmljaWFscyA9IGRhdGEyXHJcbiAgICAgICAgICAkKCcjZGV0YWlscycpLmh0bWwgdGVtcGxhdGVzLmdldF9odG1sKDAsIGRhdGEpXHJcbiAgICAgICAgICBhY3RpdmF0ZV90YWIoKVxyXG4gICAgICAgICAgI2dvdm1hcC5nZW9jb2RlIGRhdGFbMF1cclxuICAgICAgcmV0dXJuXHJcbiAgICBlcnJvcjooZSkgLT5cclxuICAgICAgY29uc29sZS5sb2cgZVxyXG5cclxuXHJcbmdldF9lbGVjdGVkX29mZmljaWFscyA9IChnb3ZfaWQsIGxpbWl0LCBvbnN1Y2Nlc3MpIC0+XHJcbiAgJC5hamF4XHJcbiAgICB1cmw6XCJodHRwOi8vNDYuMTAxLjMuNzk6ODAvcmVzdC9kYi9lbGVjdGVkX29mZmljaWFsc1wiXHJcbiAgICBkYXRhOlxyXG4gICAgICBmaWx0ZXI6XCJnb3ZzX2lkPVwiICsgZ292X2lkXHJcbiAgICAgIGZpZWxkczpcImdvdnNfaWQsdGl0bGUsZnVsbF9uYW1lLGVtYWlsX2FkZHJlc3MscGhvdG9fdXJsLHRlcm1fZXhwaXJlc1wiXHJcbiAgICAgIGFwcF9uYW1lOlwiZ292d2lraVwiXHJcbiAgICAgIG9yZGVyOlwiZGlzcGxheV9vcmRlclwiXHJcbiAgICAgIGxpbWl0OmxpbWl0XHJcblxyXG4gICAgZGF0YVR5cGU6ICdqc29uJ1xyXG4gICAgY2FjaGU6IHRydWVcclxuICAgIHN1Y2Nlc3M6IG9uc3VjY2Vzc1xyXG4gICAgZXJyb3I6KGUpIC0+XHJcbiAgICAgIGNvbnNvbGUubG9nIGVcclxuXHJcblxyXG53aW5kb3cuR09WV0lLSS5zaG93X3JlY29yZCA9KHJlYyk9PlxyXG4gICQoJyNkZXRhaWxzJykuaHRtbCB0ZW1wbGF0ZXMuZ2V0X2h0bWwoMCwgcmVjKVxyXG4gIGFjdGl2YXRlX3RhYigpXHJcbiAgR09WV0lLSS5zaG93X2RhdGFfcGFnZSgpXHJcblxyXG53aW5kb3cuR09WV0lLSS5zaG93X3JlY29yZDIgPShyZWMpPT5cclxuICBnZXRfZWxlY3RlZF9vZmZpY2lhbHMgcmVjLl9pZCwgMjUsIChkYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikgLT5cclxuICAgIHJlYy5lbGVjdGVkX29mZmljaWFscyA9IGRhdGFcclxuICAgICQoJyNkZXRhaWxzJykuaHRtbCB0ZW1wbGF0ZXMuZ2V0X2h0bWwoMCwgcmVjKVxyXG4gICAgZ2V0X3JlY29yZDIgcmVjLl9pZFxyXG4gICAgYWN0aXZhdGVfdGFiKClcclxuICAgIEdPVldJS0kuc2hvd19kYXRhX3BhZ2UoKVxyXG5cclxuXHJcbiMjI1xyXG53aW5kb3cuc2hvd19yZWMgPSAocmVjKS0+XHJcbiAgJCgnI2RldGFpbHMnKS5odG1sIHRlbXBsYXRlcy5nZXRfaHRtbCgwLCByZWMpXHJcbiAgYWN0aXZhdGVfdGFiKClcclxuIyMjXHJcblxyXG5idWlsZF9zZWxlY3RvciA9IChjb250YWluZXIsIHRleHQsIGNvbW1hbmQsIHdoZXJlX3RvX3N0b3JlX3ZhbHVlICkgLT5cclxuICAkLmFqYXhcclxuICAgIHVybDogJ2h0dHBzOi8vYXBpLm1vbmdvbGFiLmNvbS9hcGkvMS9kYXRhYmFzZXMvZ292d2lraS9ydW5Db21tYW5kP2FwaUtleT0wWTVYX1FrMnVPSlJkSEpXSktTUldrNmw2SnFWVFMyeSdcclxuICAgIHR5cGU6ICdQT1NUJ1xyXG4gICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvblwiXHJcbiAgICBkYXRhVHlwZTogJ2pzb24nXHJcbiAgICBkYXRhOiBjb21tYW5kICNKU09OLnN0cmluZ2lmeShjb21tYW5kKVxyXG4gICAgY2FjaGU6IHRydWVcclxuICAgIHN1Y2Nlc3M6IChkYXRhKSA9PlxyXG4gICAgICAjYT0kLmV4dGVuZCB0cnVlIFtdLGRhdGFcclxuICAgICAgdmFsdWVzPWRhdGEudmFsdWVzXHJcbiAgICAgIGJ1aWxkX3NlbGVjdF9lbGVtZW50IGNvbnRhaW5lciwgdGV4dCwgdmFsdWVzLnNvcnQoKSwgd2hlcmVfdG9fc3RvcmVfdmFsdWVcclxuICAgICAgcmV0dXJuXHJcbiAgICBlcnJvcjooZSkgLT5cclxuICAgICAgY29uc29sZS5sb2cgZVxyXG5cclxuXHJcbmJ1aWxkX3NlbGVjdF9lbGVtZW50ID0gKGNvbnRhaW5lciwgdGV4dCwgYXJyLCB3aGVyZV90b19zdG9yZV92YWx1ZSApIC0+XHJcbiAgcyAgPSBcIjxzZWxlY3QgY2xhc3M9J2Zvcm0tY29udHJvbCcgc3R5bGU9J21heHdpZHRoOjE2MHB4Oyc+PG9wdGlvbiB2YWx1ZT0nJz4je3RleHR9PC9vcHRpb24+XCJcclxuICBzICs9IFwiPG9wdGlvbiB2YWx1ZT0nI3t2fSc+I3t2fTwvb3B0aW9uPlwiIGZvciB2IGluIGFyciB3aGVuIHZcclxuICBzICs9IFwiPC9zZWxlY3Q+XCJcclxuICBzZWxlY3QgPSAkKHMpXHJcbiAgJChjb250YWluZXIpLmFwcGVuZChzZWxlY3QpXHJcbiAgXHJcbiAgIyBzZXQgZGVmYXVsdCAnQ0EnXHJcbiAgaWYgdGV4dCBpcyAnU3RhdGUuLidcclxuICAgIHNlbGVjdC52YWwgJ0NBJ1xyXG4gICAgd2luZG93LkdPVldJS0kuc3RhdGVfZmlsdGVyPSdDQSdcclxuICAgIGdvdm1hcC5vbl9ib3VuZHNfY2hhbmdlZF9sYXRlcigpXHJcblxyXG4gIHNlbGVjdC5jaGFuZ2UgKGUpIC0+XHJcbiAgICBlbCA9ICQoZS50YXJnZXQpXHJcbiAgICB3aW5kb3cuR09WV0lLSVt3aGVyZV90b19zdG9yZV92YWx1ZV0gPSBlbC52YWwoKVxyXG4gICAgJCgnLmdvdi1jb3VudGVyJykudGV4dCBnb3Zfc2VsZWN0b3IuY291bnRfZ292cygpXHJcbiAgICBnb3ZtYXAub25fYm91bmRzX2NoYW5nZWQoKVxyXG5cclxuXHJcbmFkanVzdF90eXBlYWhlYWRfd2lkdGggPSgpIC0+XHJcbiAgaW5wID0gJCgnI215aW5wdXQnKVxyXG4gIHBhciA9ICQoJyN0eXBlYWhlZC1jb250YWluZXInKVxyXG4gIGlucC53aWR0aCBwYXIud2lkdGgoKVxyXG5cclxuXHJcblxyXG5zdGFydF9hZGp1c3RpbmdfdHlwZWFoZWFkX3dpZHRoID0oKSAtPlxyXG4gICQod2luZG93KS5yZXNpemUgLT5cclxuICAgIGFkanVzdF90eXBlYWhlYWRfd2lkdGgoKVxyXG5cclxuXHJcbiMgYWRkIGxpdmUgcmVsb2FkIHRvIHRoZSBzaXRlLiBGb3IgZGV2ZWxvcG1lbnQgb25seS5cclxubGl2ZXJlbG9hZCA9IChwb3J0KSAtPlxyXG4gIHVybD13aW5kb3cubG9jYXRpb24ub3JpZ2luLnJlcGxhY2UgLzpbXjpdKiQvLCBcIlwiXHJcbiAgJC5nZXRTY3JpcHQgdXJsICsgXCI6XCIgKyBwb3J0LCA9PlxyXG4gICAgJCgnYm9keScpLmFwcGVuZCBcIlwiXCJcclxuICAgIDxkaXYgc3R5bGU9J3Bvc2l0aW9uOmFic29sdXRlO3otaW5kZXg6MTAwMDtcclxuICAgIHdpZHRoOjEwMCU7IHRvcDowO2NvbG9yOnJlZDsgdGV4dC1hbGlnbjogY2VudGVyOyBcclxuICAgIHBhZGRpbmc6MXB4O2ZvbnQtc2l6ZToxMHB4O2xpbmUtaGVpZ2h0OjEnPmxpdmU8L2Rpdj5cclxuICAgIFwiXCJcIlxyXG5cclxuZm9jdXNfc2VhcmNoX2ZpZWxkID0gKG1zZWMpIC0+XHJcbiAgc2V0VGltZW91dCAoLT4gJCgnI215aW5wdXQnKS5mb2N1cygpKSAsbXNlY1xyXG5cclxuXHJcbiAgXHJcblxyXG5cclxuIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuXHJcbiN0ZW1wbGF0ZXMubG9hZF90ZW1wbGF0ZSBcInRhYnNcIiwgXCJjb25maWcvdGFibGF5b3V0Lmpzb25cIlxyXG50ZW1wbGF0ZXMubG9hZF9mdXNpb25fdGVtcGxhdGUgXCJ0YWJzXCIsIFwiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vZnVzaW9udGFibGVzL3YyL3F1ZXJ5P3NxbD1TRUxFQ1QlMjAqJTIwRlJPTSUyMDF6Mm9YUUVZUTNwMk9vTUk4VjVnS2dIV0I1VHo5OTBCclExeGMxdFZvJmtleT1BSXphU3lDWERReU1EcEdBMmczUWp1djRDRHY3elJqLWl4NElRSkFcIlxyXG5cclxuYnVpbGRfc2VsZWN0b3IoJy5zdGF0ZS1jb250YWluZXInICwgJ1N0YXRlLi4nICwgJ3tcImRpc3RpbmN0XCI6IFwiZ292c1wiLFwia2V5XCI6XCJzdGF0ZVwifScgLCAnc3RhdGVfZmlsdGVyJylcclxuYnVpbGRfc2VsZWN0b3IoJy5nb3YtdHlwZS1jb250YWluZXInICwgJ3R5cGUgb2YgZ292ZXJubWVudC4uJyAsICd7XCJkaXN0aW5jdFwiOiBcImdvdnNcIixcImtleVwiOlwiZ292X3R5cGVcIn0nICwgJ2dvdl90eXBlX2ZpbHRlcicpXHJcblxyXG5hZGp1c3RfdHlwZWFoZWFkX3dpZHRoKClcclxuc3RhcnRfYWRqdXN0aW5nX3R5cGVhaGVhZF93aWR0aCgpXHJcblxyXG4kKCcjYnRuQmFja1RvU2VhcmNoJykuY2xpY2sgKGUpLT5cclxuICBlLnByZXZlbnREZWZhdWx0KClcclxuICBHT1ZXSUtJLnNob3dfc2VhcmNoX3BhZ2UoKVxyXG5cclxuI2ZvY3VzX3NlYXJjaF9maWVsZCA1MDBcclxuXHJcbiAgXHJcblxyXG5saXZlcmVsb2FkIFwiOTA5MFwiXHJcblxyXG4iLCJcclxuXHJcblxyXG4jIFRha2VzIGFuIGFycmF5IG9mIGRvY3MgdG8gc2VhcmNoIGluLlxyXG4jIFJldHVybnMgYSBmdW5jdGlvbnMgdGhhdCB0YWtlcyAyIHBhcmFtcyBcclxuIyBxIC0gcXVlcnkgc3RyaW5nIGFuZCBcclxuIyBjYiAtIGNhbGxiYWNrIHRoYXQgd2lsbCBiZSBjYWxsZWQgd2hlbiB0aGUgc2VhcmNoIGlzIGRvbmUuXHJcbiMgY2IgcmV0dXJucyBhbiBhcnJheSBvZiBtYXRjaGluZyBkb2N1bWVudHMuXHJcbiMgbXVtX2l0ZW1zIC0gbWF4IG51bWJlciBvZiBmb3VuZCBpdGVtcyB0byBzaG93XHJcblF1ZXJ5TWF0aGVyID0gKGRvY3MsIG51bV9pdGVtcz01KSAtPlxyXG4gIChxLCBjYikgLT5cclxuICAgIHRlc3Rfc3RyaW5nID0ocywgcmVncykgLT5cclxuICAgICAgKGlmIG5vdCByLnRlc3QocykgdGhlbiByZXR1cm4gZmFsc2UpICBmb3IgciBpbiByZWdzXHJcbiAgICAgIHJldHVybiB0cnVlXHJcblxyXG4gICAgW3dvcmRzLHJlZ3NdID0gZ2V0X3dvcmRzX3JlZ3MgcVxyXG4gICAgbWF0Y2hlcyA9IFtdXHJcbiAgICAjIGl0ZXJhdGUgdGhyb3VnaCB0aGUgcG9vbCBvZiBkb2NzIGFuZCBmb3IgYW55IHN0cmluZyB0aGF0XHJcbiAgICAjIGNvbnRhaW5zIHRoZSBzdWJzdHJpbmcgYHFgLCBhZGQgaXQgdG8gdGhlIGBtYXRjaGVzYCBhcnJheVxyXG5cclxuICAgIGZvciBkIGluIGRvY3NcclxuICAgICAgaWYgbWF0Y2hlcy5sZW5ndGggPj0gbnVtX2l0ZW1zIHRoZW4gYnJlYWtcclxuICAgICAgaWYgR09WV0lLSS5zdGF0ZV9maWx0ZXIgYW5kIGQuc3RhdGUgaXNudCBHT1ZXSUtJLnN0YXRlX2ZpbHRlciB0aGVuIGNvbnRpbnVlXHJcbiAgICAgIGlmIEdPVldJS0kuZ292X3R5cGVfZmlsdGVyIGFuZCBkLmdvdl90eXBlIGlzbnQgR09WV0lLSS5nb3ZfdHlwZV9maWx0ZXIgdGhlbiBjb250aW51ZVxyXG5cclxuICAgICAgaWYgdGVzdF9zdHJpbmcoZC5nb3ZfbmFtZSwgcmVncykgdGhlbiBtYXRjaGVzLnB1c2ggJC5leHRlbmQoe30sIGQpXHJcbiAgICAgICNpZiB0ZXN0X3N0cmluZyhcIiN7ZC5nb3ZfbmFtZX0gI3tkLnN0YXRlfSAje2QuZ292X3R5cGV9ICN7ZC5pbmNfaWR9XCIsIHJlZ3MpIHRoZW4gbWF0Y2hlcy5wdXNoICQuZXh0ZW5kKHt9LCBkKVxyXG4gICAgXHJcbiAgICBzZWxlY3RfdGV4dCBtYXRjaGVzLCB3b3JkcywgcmVnc1xyXG4gICAgY2IgbWF0Y2hlc1xyXG4gICAgcmV0dXJuXHJcbiBcclxuXHJcbiMgaW5zZXJ0cyA8c3Ryb25nPiBlbGVtZW50c2UgaW4gYXJyYXlcclxuc2VsZWN0X3RleHQgPSAoY2xvbmVzLHdvcmRzLHJlZ3MpIC0+XHJcbiAgZm9yIGQgaW4gY2xvbmVzXHJcbiAgICBkLmdvdl9uYW1lPXN0cm9uZ2lmeShkLmdvdl9uYW1lLCB3b3JkcywgcmVncylcclxuICAgICNkLnN0YXRlPXN0cm9uZ2lmeShkLnN0YXRlLCB3b3JkcywgcmVncylcclxuICAgICNkLmdvdl90eXBlPXN0cm9uZ2lmeShkLmdvdl90eXBlLCB3b3JkcywgcmVncylcclxuICBcclxuICByZXR1cm4gY2xvbmVzXHJcblxyXG5cclxuXHJcbiMgaW5zZXJ0cyA8c3Ryb25nPiBlbGVtZW50c2Vcclxuc3Ryb25naWZ5ID0gKHMsIHdvcmRzLCByZWdzKSAtPlxyXG4gIHJlZ3MuZm9yRWFjaCAocixpKSAtPlxyXG4gICAgcyA9IHMucmVwbGFjZSByLCBcIjxiPiN7d29yZHNbaV19PC9iPlwiXHJcbiAgcmV0dXJuIHNcclxuXHJcbiMgcmVtb3ZlcyA8PiB0YWdzIGZyb20gYSBzdHJpbmdcclxuc3RyaXAgPSAocykgLT5cclxuICBzLnJlcGxhY2UoLzxbXjw+XSo+L2csJycpXHJcblxyXG5cclxuIyBhbGwgdGlybXMgc3BhY2VzIGZyb20gYm90aCBzaWRlcyBhbmQgbWFrZSBjb250cmFjdHMgc2VxdWVuY2VzIG9mIHNwYWNlcyB0byAxXHJcbmZ1bGxfdHJpbSA9IChzKSAtPlxyXG4gIHNzPXMudHJpbSgnJytzKVxyXG4gIHNzPXNzLnJlcGxhY2UoLyArL2csJyAnKVxyXG5cclxuIyByZXR1cm5zIGFuIGFycmF5IG9mIHdvcmRzIGluIGEgc3RyaW5nXHJcbmdldF93b3JkcyA9IChzdHIpIC0+XHJcbiAgZnVsbF90cmltKHN0cikuc3BsaXQoJyAnKVxyXG5cclxuXHJcbmdldF93b3Jkc19yZWdzID0gKHN0cikgLT5cclxuICB3b3JkcyA9IGdldF93b3JkcyBzdHJcclxuICByZWdzID0gd29yZHMubWFwICh3KS0+IG5ldyBSZWdFeHAoXCIje3d9XCIsJ2lnJylcclxuICBbd29yZHMscmVnc11cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXJ5TWF0aGVyXHJcblxyXG4iLCJcclxuIyMjXHJcbiMgZmlsZTogdGVtcGxhdGVzMi5jb2ZmZWUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4jXHJcbiMgQ2xhc3MgdG8gbWFuYWdlIHRlbXBsYXRlcyBhbmQgcmVuZGVyIGRhdGEgb24gaHRtbCBwYWdlLlxyXG4jXHJcbiMgVGhlIG1haW4gbWV0aG9kIDogcmVuZGVyKGRhdGEpLCBnZXRfaHRtbChkYXRhKVxyXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4jIyNcclxuXHJcblxyXG5cclxuIyBMT0FEIEZJRUxEIE5BTUVTIFxyXG5maWVsZE5hbWVzID0ge31cclxuXHJcblxyXG5yZW5kZXJfZmllbGRfdmFsdWUgPShuLGRhdGEpIC0+XHJcbiAgdj1kYXRhW25dXHJcbiAgaWYgbm90IGRhdGFbbl1cclxuICAgIHJldHVybiAnJ1xyXG5cclxuICBpZiBuID09IFwid2ViX3NpdGVcIlxyXG4gICAgcmV0dXJuIFwiPGEgdGFyZ2V0PSdfYmxhbmsnIGhyZWY9JyN7dn0nPiN7dn08L2E+XCJcclxuICBlbHNlXHJcbiAgICByZXR1cm4gdlxyXG4gIFxyXG4gIFxyXG5cclxucmVuZGVyX2ZpZWxkX25hbWUgPSAoZk5hbWUpIC0+XHJcbiAgaWYgZmllbGROYW1lc1tmTmFtZV0/XHJcbiAgICByZXR1cm4gZmllbGROYW1lc1tmTmFtZV1cclxuXHJcbiAgcyA9IGZOYW1lLnJlcGxhY2UoL18vZyxcIiBcIilcclxuICBzID0gcy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHMuc3Vic3RyaW5nKDEpXHJcbiAgcmV0dXJuIHNcclxuXHJcblxyXG5yZW5kZXJfZmllbGQgPSAoZk5hbWUsZGF0YSktPlxyXG4gIGlmIFwiX1wiID09IHN1YnN0ciBmTmFtZSwgMCwgMVxyXG4gICAgXCJcIlwiXHJcbiAgICA8ZGl2PlxyXG4gICAgICAgIDxzcGFuIGNsYXNzPSdmLW5hbSc+I3tyZW5kZXJfZmllbGRfbmFtZSBmTmFtZX08L3NwYW4+XHJcbiAgICAgICAgPHNwYW4gY2xhc3M9J2YtdmFsJz4mbmJzcDs8L3NwYW4+XHJcbiAgICA8L2Rpdj5cclxuICAgIFwiXCJcIlxyXG4gIGVsc2VcclxuICAgIHJldHVybiAnJyB1bmxlc3MgZlZhbHVlID0gZGF0YVtmTmFtZV1cclxuICAgIFwiXCJcIlxyXG4gICAgPGRpdj5cclxuICAgICAgICA8c3BhbiBjbGFzcz0nZi1uYW0nPiN7cmVuZGVyX2ZpZWxkX25hbWUgZk5hbWV9PC9zcGFuPlxyXG4gICAgICAgIDxzcGFuIGNsYXNzPSdmLXZhbCc+I3tyZW5kZXJfZmllbGRfdmFsdWUoZk5hbWUsZGF0YSl9PC9zcGFuPlxyXG4gICAgPC9kaXY+XHJcbiAgICBcIlwiXCJcclxuXHJcbiAgXHJcbnJlbmRlcl9maWVsZHMgPSAoZmllbGRzLGRhdGEsdGVtcGxhdGUpLT5cclxuICBoID0gJydcclxuICBmb3IgZmllbGQsaSBpbiBmaWVsZHNcclxuICAgIGZWYWx1ZSA9IHJlbmRlcl9maWVsZF92YWx1ZSBmaWVsZCwgZGF0YVxyXG4gICAgaWYgKCcnICE9IGZWYWx1ZSlcclxuICAgICAgZk5hbWUgPSByZW5kZXJfZmllbGRfbmFtZSBmaWVsZFxyXG4gICAgICBoICs9IHRlbXBsYXRlKG5hbWU6IGZOYW1lLCB2YWx1ZTogZlZhbHVlKVxyXG4gIHJldHVybiBoXHJcblxyXG5cclxudW5kZXIgPSAocykgLT4gcy5yZXBsYWNlKC9bXFxzXFwrXFwtXS9nLCAnXycpXHJcblxyXG5cclxucmVuZGVyX3RhYnMgPSAoaW5pdGlhbF9sYXlvdXQsIGRhdGEsIHRhYnNldCwgcGFyZW50KSAtPlxyXG4gICNsYXlvdXQgPSBhZGRfb3RoZXJfdGFiX3RvX2xheW91dCBpbml0aWFsX2xheW91dCwgZGF0YVxyXG4gIGxheW91dCA9IGluaXRpYWxfbGF5b3V0XHJcbiAgdGVtcGxhdGVzID0gcGFyZW50LnRlbXBsYXRlc1xyXG4gIHBsb3RfaGFuZGxlcyA9IHt9XHJcblxyXG4gIGxheW91dF9kYXRhID1cclxuICAgIHRpdGxlOiBkYXRhLmdvdl9uYW1lLFxyXG4gICAgdGFiczogW10sXHJcbiAgICB0YWJjb250ZW50OiAnJ1xyXG4gIFxyXG4gIGZvciB0YWIsaSBpbiBsYXlvdXRcclxuICAgIGxheW91dF9kYXRhLnRhYnMucHVzaFxyXG4gICAgICB0YWJpZDogdW5kZXIodGFiLm5hbWUpLFxyXG4gICAgICB0YWJuYW1lOiB0YWIubmFtZSxcclxuICAgICAgYWN0aXZlOiAoaWYgaT4wIHRoZW4gJycgZWxzZSAnYWN0aXZlJylcclxuXHJcbiAgZm9yIHRhYixpIGluIGxheW91dFxyXG4gICAgZGV0YWlsX2RhdGEgPVxyXG4gICAgICB0YWJpZDogdW5kZXIodGFiLm5hbWUpLFxyXG4gICAgICB0YWJuYW1lOiB0YWIubmFtZSxcclxuICAgICAgYWN0aXZlOiAoaWYgaT4wIHRoZW4gJycgZWxzZSAnYWN0aXZlJylcclxuICAgICAgdGFiY29udGVudDogJydcclxuICAgIHN3aXRjaCB0YWIubmFtZVxyXG4gICAgICB3aGVuICdPdmVydmlldyArIEVsZWN0ZWQgT2ZmaWNpYWxzJ1xyXG4gICAgICAgIGRldGFpbF9kYXRhLnRhYmNvbnRlbnQgKz0gcmVuZGVyX2ZpZWxkcyB0YWIuZmllbGRzLCBkYXRhLCB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC1uYW1ldmFsdWUtdGVtcGxhdGUnXVxyXG4gICAgICAgIGZvciBvZmZpY2lhbCxpIGluIGRhdGEuZWxlY3RlZF9vZmZpY2lhbHMucmVjb3JkXHJcbiAgICAgICAgICBvZmZpY2lhbF9kYXRhID1cclxuICAgICAgICAgICAgdGl0bGU6IGlmICcnICE9IG9mZmljaWFsLnRpdGxlIHRoZW4gXCJUaXRsZTogXCIgKyBvZmZpY2lhbC50aXRsZSBlbHNlICcnXHJcbiAgICAgICAgICAgIG5hbWU6IGlmICcnICE9IG9mZmljaWFsLmZ1bGxfbmFtZSB0aGVuIFwiTmFtZTogXCIgKyBvZmZpY2lhbC5mdWxsX25hbWUgZWxzZSAnJ1xyXG4gICAgICAgICAgICBlbWFpbDogaWYgJycgIT0gb2ZmaWNpYWwuZW1haWxfYWRkcmVzcyB0aGVuIFwiRW1haWw6IFwiICsgb2ZmaWNpYWwuZW1haWxfYWRkcmVzcyBlbHNlICcnXHJcbiAgICAgICAgICAgIHRlcm1leHBpcmVzOiBpZiAnJyAhPSBvZmZpY2lhbC50ZXJtX2V4cGlyZXMgdGhlbiBcIlRlcm0gRXhwaXJlczogXCIgKyBvZmZpY2lhbC50ZXJtX2V4cGlyZXMgZWxzZSAnJ1xyXG4gICAgICAgICAgb2ZmaWNpYWxfZGF0YS5pbWFnZSA9ICc8aW1nIHNyYz1cIicrb2ZmaWNpYWwucGhvdG9fdXJsKydcIiBhbHQ9XCJcIiAvPicgaWYgJycgIT0gb2ZmaWNpYWwucGhvdG9fdXJsXHJcbiAgICAgICAgICBkZXRhaWxfZGF0YS50YWJjb250ZW50ICs9IHRlbXBsYXRlc1sndGFiZGV0YWlsLW9mZmljaWFsLXRlbXBsYXRlJ10ob2ZmaWNpYWxfZGF0YSlcclxuICAgICAgd2hlbiAnRW1wbG95ZWUgQ29tcGVuc2F0aW9uJ1xyXG4gICAgICAgIGggPSAnJ1xyXG4gICAgICAgIGggKz0gcmVuZGVyX2ZpZWxkcyB0YWIuZmllbGRzLCBkYXRhLCB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC1uYW1ldmFsdWUtdGVtcGxhdGUnXVxyXG4gICAgICAgIGRldGFpbF9kYXRhLnRhYmNvbnRlbnQgKz0gdGVtcGxhdGVzWyd0YWJkZXRhaWwtZW1wbG95ZWUtY29tcC10ZW1wbGF0ZSddKGNvbnRlbnQ6IGgpXHJcbiAgICAgICAgdGFic2V0LmJpbmQgdGFiLm5hbWUsICh0cGxfbmFtZSwgZGF0YSkgLT5cclxuICAgICAgICAgIG9wdGlvbnMgPVxyXG4gICAgICAgICAgICB4YXhpczpcclxuICAgICAgICAgICAgICBtaW5UaWNrU2l6ZTogMlxyXG4gICAgICAgICAgICBzZXJpZXM6XHJcbiAgICAgICAgICAgICAgYmFyczpcclxuICAgICAgICAgICAgICAgIHNob3c6IHRydWVcclxuICAgICAgICAgICAgICAgIGJhcldpZHRoOiAuOVxyXG4gICAgICAgICAgICAgICAgYWxpZ246IFwiY2VudGVyXCJcclxuICAgICAgICAgIGlmIG5vdCBwbG90X2hhbmRsZXNbJ21lZGlhbi1jb21wLWdyYXBoJ11cclxuICAgICAgICAgICAgb3B0aW9ucy54YXhpcy50aWNrcyA9IFtbMSwgXCJNZWRpYW4gVG90YWwgR292LiBDb21wXCJdLCBbMiwgXCJNZWRpYW4gVG90YWwgSW5kaXZpZHVhbCBDb21wXCJdXVxyXG4gICAgICAgICAgICBwbG90X3NwZWMgPSBbXVxyXG4gICAgICAgICAgICBwbG90X2RhdGFfYm90dG9tID0gW1sxLCBkYXRhWydtZWRpYW5fdG90YWxfY29tcF9wZXJfZnRfZW1wJ10gLyBkYXRhWydtZWRpYW5fdG90YWxfY29tcF9vdmVyX21lZGlhbl9pbmRpdmlkdWFsX2NvbXAnXV0sIFsyLCBkYXRhWydtZWRpYW5fdG90YWxfY29tcF9wZXJfZnRfZW1wJ11dXVxyXG4gICAgICAgICAgICBwbG90X2RhdGFfdG9wID0gW1tdLCBbXV1cclxuICAgICAgICAgICAgcGxvdF9zcGVjLnB1c2hcclxuICAgICAgICAgICAgICBkYXRhOiBwbG90X2RhdGFfYm90dG9tXHJcbiAgICAgICAgICAgICMjI1xyXG4gICAgICAgICAgICBwbG90X3NwZWMucHVzaFxyXG4gICAgICAgICAgICAgIGRhdGE6IHBsb3RfZGF0YV90b3BcclxuICAgICAgICAgICAgIyMjXHJcbiAgICAgICAgICAgIHBsb3RfaGFuZGxlc1snbWVkaWFuLWNvbXAtZ3JhcGgnXSA9ICQoXCIjbWVkaWFuLWNvbXAtZ3JhcGhcIikucGxvdChwbG90X3NwZWMsIG9wdGlvbnMpXHJcbiAgICAgICAgICBpZiBub3QgcGxvdF9oYW5kbGVzWydtZWRpYW4tcGVuc2lvbi1ncmFwaCddXHJcbiAgICAgICAgICAgIG9wdGlvbnMueGF4aXMudGlja3MgPSBbWzEsIFwiTWVkaWFuIFBlbnNpb24gZm9yIFJldGlyZWUgdy8gMzAgWWVhcnNcIl0sIFsyLCBcIk1lZGlhbiBUb3RhbCBJbmRpdmlkdWFsIENvbXBcIl1dXHJcbiAgICAgICAgICAgIHBsb3Rfc3BlYyA9IFtdXHJcbiAgICAgICAgICAgIHBsb3RfZGF0YV9ib3R0b20gPSBbWzEsIGRhdGFbJ21lZGlhbl9wZW5zaW9uXzMwX3llYXJfcmV0aXJlZSddXSwgWzIsIGRhdGFbJ21lZGlhbl9lYXJuaW5ncyddXV1cclxuICAgICAgICAgICAgcGxvdF9kYXRhX3RvcCA9IFtbXSwgW11dXHJcbiAgICAgICAgICAgIHBsb3Rfc3BlYy5wdXNoXHJcbiAgICAgICAgICAgICAgZGF0YTogcGxvdF9kYXRhX2JvdHRvbVxyXG4gICAgICAgICAgICAjIyNcclxuICAgICAgICAgICAgcGxvdF9zcGVjLnB1c2hcclxuICAgICAgICAgICAgICBkYXRhOiBwbG90X2RhdGFfdG9wXHJcbiAgICAgICAgICAgICMjI1xyXG4gICAgICAgICAgICBwbG90X2hhbmRsZXNbJ21lZGlhbi1wZW5zaW9uLWdyYXBoJ10gPSAkKFwiI21lZGlhbi1wZW5zaW9uLWdyYXBoXCIpLnBsb3QocGxvdF9zcGVjLCBvcHRpb25zKVxyXG4gICAgICAgICAgI2lmIG5vdCBwbG90X2hhbmRsZXNbJ3BjdC1wZW5zaW9uLWdyYXBoJ11cclxuICAgICAgICAgIGlmIGZhbHNlXHJcbiAgICAgICAgICAgIHBsb3Rfc3BlYyA9IFtdXHJcbiAgICAgICAgICAgIHBsb3RfZGF0YV9ib3R0b20gPSBbW10sIFtdXVxyXG4gICAgICAgICAgICBwbG90X2RhdGFfdG9wID0gW1tdLCBbXV1cclxuICAgICAgICAgICAgcGxvdF9zcGVjLnB1c2hcclxuICAgICAgICAgICAgICBkYXRhOiBwbG90X2RhdGFfYm90dG9tXHJcbiAgICAgICAgICAgICAgbGFiZWw6IFwiUGVuc2lvbiAmIE9QRUIgKHJlcSdkKSBhcyAlIG9mIHRvdGFsIHJldmVudWVcIlxyXG4gICAgICAgICAgICAjIyNcclxuICAgICAgICAgICAgcGxvdF9zcGVjLnB1c2hcclxuICAgICAgICAgICAgICBkYXRhOiBwbG90X2RhdGFfdG9wXHJcbiAgICAgICAgICAgICAgbGFiZWw6IFwiTWVkaWFuIFRvdGFsIEluZGl2aWR1YWwgQ29tcFwiXHJcbiAgICAgICAgICAgICMjI1xyXG4gICAgICAgICAgICBwbG90X2hhbmRsZXNbJ3BjdC1wZW5zaW9uLWdyYXBoJ10gPSAkKFwiI3BjdC1wZW5zaW9uLWdyYXBoXCIpLnBsb3QocGxvdF9zcGVjLCBvcHRpb25zKVxyXG4gICAgICBlbHNlXHJcbiAgICAgICAgZGV0YWlsX2RhdGEudGFiY29udGVudCArPSByZW5kZXJfZmllbGRzIHRhYi5maWVsZHMsIGRhdGEsIHRlbXBsYXRlc1sndGFiZGV0YWlsLW5hbWV2YWx1ZS10ZW1wbGF0ZSddXHJcbiAgICBcclxuICAgIGxheW91dF9kYXRhLnRhYmNvbnRlbnQgKz0gdGVtcGxhdGVzWyd0YWJkZXRhaWwtdGVtcGxhdGUnXShkZXRhaWxfZGF0YSlcclxuICByZXR1cm4gdGVtcGxhdGVzWyd0YWJwYW5lbC10ZW1wbGF0ZSddKGxheW91dF9kYXRhKVxyXG5cclxuXHJcbmdldF9sYXlvdXRfZmllbGRzID0gKGxhKSAtPlxyXG4gIGYgPSB7fVxyXG4gIGZvciB0IGluIGxhXHJcbiAgICBmb3IgZmllbGQgaW4gdC5maWVsZHNcclxuICAgICAgZltmaWVsZF0gPSAxXHJcbiAgcmV0dXJuIGZcclxuXHJcbmdldF9yZWNvcmRfZmllbGRzID0gKHIpIC0+XHJcbiAgZiA9IHt9XHJcbiAgZm9yIGZpZWxkX25hbWUgb2YgclxyXG4gICAgZltmaWVsZF9uYW1lXSA9IDFcclxuICByZXR1cm4gZlxyXG5cclxuZ2V0X3VubWVudGlvbmVkX2ZpZWxkcyA9IChsYSwgcikgLT5cclxuICBsYXlvdXRfZmllbGRzID0gZ2V0X2xheW91dF9maWVsZHMgbGFcclxuICByZWNvcmRfZmllbGRzID0gZ2V0X3JlY29yZF9maWVsZHMgclxyXG4gIHVubWVudGlvbmVkX2ZpZWxkcyA9IFtdXHJcbiAgdW5tZW50aW9uZWRfZmllbGRzLnB1c2goZikgZm9yIGYgb2YgcmVjb3JkX2ZpZWxkcyB3aGVuIG5vdCBsYXlvdXRfZmllbGRzW2ZdXHJcbiAgcmV0dXJuIHVubWVudGlvbmVkX2ZpZWxkc1xyXG5cclxuXHJcbmFkZF9vdGhlcl90YWJfdG9fbGF5b3V0ID0gKGxheW91dD1bXSwgZGF0YSkgLT5cclxuICAjY2xvbmUgdGhlIGxheW91dFxyXG4gIGwgPSAkLmV4dGVuZCB0cnVlLCBbXSwgbGF5b3V0XHJcbiAgdCA9XHJcbiAgICBuYW1lOiBcIk90aGVyXCJcclxuICAgIGZpZWxkczogZ2V0X3VubWVudGlvbmVkX2ZpZWxkcyBsLCBkYXRhXHJcblxyXG4gIGwucHVzaCB0XHJcbiAgcmV0dXJuIGxcclxuXHJcblxyXG4jIGNvbnZlcnRzIHRhYiB0ZW1wbGF0ZSBkZXNjcmliZWQgaW4gZ29vZ2xlIGZ1c2lvbiB0YWJsZSB0byBcclxuIyB0YWIgdGVtcGxhdGVcclxuY29udmVydF9mdXNpb25fdGVtcGxhdGU9KHRlbXBsKSAtPlxyXG4gIHRhYl9oYXNoPXt9XHJcbiAgdGFicz1bXVxyXG4gICMgcmV0dXJucyBoYXNoIG9mIGZpZWxkIG5hbWVzIGFuZCB0aGVpciBwb3NpdGlvbnMgaW4gYXJyYXkgb2YgZmllbGQgbmFtZXNcclxuICBnZXRfY29sX2hhc2ggPSAoY29sdW1ucykgLT5cclxuICAgIGNvbF9oYXNoID17fVxyXG4gICAgY29sX2hhc2hbY29sX25hbWVdPWkgZm9yIGNvbF9uYW1lLGkgaW4gdGVtcGwuY29sdW1uc1xyXG4gICAgcmV0dXJuIGNvbF9oYXNoXHJcbiAgXHJcbiAgIyByZXR1cm5zIGZpZWxkIHZhbHVlIGJ5IGl0cyBuYW1lLCBhcnJheSBvZiBmaWVsZHMsIGFuZCBoYXNoIG9mIGZpZWxkc1xyXG4gIHZhbCA9IChmaWVsZF9uYW1lLCBmaWVsZHMsIGNvbF9oYXNoKSAtPlxyXG4gICAgZmllbGRzW2NvbF9oYXNoW2ZpZWxkX25hbWVdXVxyXG4gIFxyXG4gICMgY29udmVydHMgaGFzaCB0byBhbiBhcnJheSB0ZW1wbGF0ZVxyXG4gIGhhc2hfdG9fYXJyYXkgPShoYXNoKSAtPlxyXG4gICAgYSA9IFtdXHJcbiAgICBmb3IgayBvZiBoYXNoXHJcbiAgICAgIHRhYiA9IHt9XHJcbiAgICAgIHRhYi5uYW1lPWtcclxuICAgICAgdGFiLmZpZWxkcz1oYXNoW2tdXHJcbiAgICAgIGEucHVzaCB0YWJcclxuICAgIHJldHVybiBhXHJcblxyXG4gICAgXHJcbiAgY29sX2hhc2ggPSBnZXRfY29sX2hhc2godGVtcGwuY29sX2hhc2gpXHJcbiAgcGxhY2Vob2xkZXJfY291bnQgPSAwXHJcbiAgXHJcbiAgZm9yIHJvdyxpIGluIHRlbXBsLnJvd3NcclxuICAgIGNhdGVnb3J5ID0gdmFsICdnZW5lcmFsX2NhdGVnb3J5Jywgcm93LCBjb2xfaGFzaFxyXG4gICAgI3RhYl9oYXNoW2NhdGVnb3J5XT1bXSB1bmxlc3MgdGFiX2hhc2hbY2F0ZWdvcnldXHJcbiAgICBmaWVsZG5hbWUgPSB2YWwgJ2ZpZWxkX25hbWUnLCByb3csIGNvbF9oYXNoXHJcbiAgICBpZiBub3QgZmllbGRuYW1lIHRoZW4gZmllbGRuYW1lID0gXCJfXCIgKyBTdHJpbmcgKytwbGFjZWhvbGRlcl9jb3VudFxyXG4gICAgZmllbGROYW1lc1t2YWwgJ2ZpZWxkX25hbWUnLCByb3csIGNvbF9oYXNoXT12YWwgJ2Rlc2NyaXB0aW9uJywgcm93LCBjb2xfaGFzaFxyXG4gICAgaWYgY2F0ZWdvcnlcclxuICAgICAgdGFiX2hhc2hbY2F0ZWdvcnldPz1bXVxyXG4gICAgICB0YWJfaGFzaFtjYXRlZ29yeV0ucHVzaCBuOiB2YWwoJ24nLCByb3csIGNvbF9oYXNoKSwgbmFtZTogZmllbGRuYW1lXHJcblxyXG4gIGNhdGVnb3JpZXMgPSBPYmplY3Qua2V5cyh0YWJfaGFzaClcclxuICBmb3IgY2F0ZWdvcnkgaW4gY2F0ZWdvcmllc1xyXG4gICAgZmllbGRzID0gW11cclxuICAgIGZvciBvYmogaW4gdGFiX2hhc2hbY2F0ZWdvcnldXHJcbiAgICAgIGZpZWxkcy5wdXNoIG9ialxyXG4gICAgZmllbGRzLnNvcnQgKGEsYikgLT5cclxuICAgICAgcmV0dXJuIGEubiAtIGIublxyXG4gICAgbmV3RmllbGRzID0gW11cclxuICAgIGZvciBmaWVsZCBpbiBmaWVsZHNcclxuICAgICAgbmV3RmllbGRzLnB1c2ggZmllbGQubmFtZVxyXG4gICAgdGFiX2hhc2hbY2F0ZWdvcnldID0gbmV3RmllbGRzXHJcblxyXG4gIHRhYnMgPSBoYXNoX3RvX2FycmF5KHRhYl9oYXNoKVxyXG4gIHJldHVybiB0YWJzXHJcblxyXG5cclxuY2xhc3MgVGVtcGxhdGVzMlxyXG5cclxuICBAbGlzdCA9IHVuZGVmaW5lZFxyXG4gIEB0ZW1wbGF0ZXMgPSB1bmRlZmluZWRcclxuICBAZGF0YSA9IHVuZGVmaW5lZFxyXG4gIEBldmVudHMgPSB1bmRlZmluZWRcclxuXHJcbiAgY29uc3RydWN0b3I6KCkgLT5cclxuICAgIEBsaXN0ID0gW11cclxuICAgIEBldmVudHMgPSB7fVxyXG4gICAgdGVtcGxhdGVMaXN0ID0gWyd0YWJwYW5lbC10ZW1wbGF0ZScsICd0YWJkZXRhaWwtdGVtcGxhdGUnLCAndGFiZGV0YWlsLW5hbWV2YWx1ZS10ZW1wbGF0ZScsICd0YWJkZXRhaWwtb2ZmaWNpYWwtdGVtcGxhdGUnLCAndGFiZGV0YWlsLWVtcGxveWVlLWNvbXAtdGVtcGxhdGUnXVxyXG4gICAgdGVtcGxhdGVQYXJ0aWFscyA9IFsndGFiLXRlbXBsYXRlJ11cclxuICAgIEB0ZW1wbGF0ZXMgPSB7fVxyXG4gICAgZm9yIHRlbXBsYXRlLGkgaW4gdGVtcGxhdGVMaXN0XHJcbiAgICAgIEB0ZW1wbGF0ZXNbdGVtcGxhdGVdID0gSGFuZGxlYmFycy5jb21waWxlKCQoJyMnICsgdGVtcGxhdGUpLmh0bWwoKSlcclxuICAgIGZvciB0ZW1wbGF0ZSxpIGluIHRlbXBsYXRlUGFydGlhbHNcclxuICAgICAgSGFuZGxlYmFycy5yZWdpc3RlclBhcnRpYWwodGVtcGxhdGUsICQoJyMnICsgdGVtcGxhdGUpLmh0bWwoKSlcclxuXHJcbiAgYWRkX3RlbXBsYXRlOiAobGF5b3V0X25hbWUsIGxheW91dF9qc29uKSAtPlxyXG4gICAgQGxpc3QucHVzaFxyXG4gICAgICBwYXJlbnQ6dGhpc1xyXG4gICAgICBuYW1lOmxheW91dF9uYW1lXHJcbiAgICAgIHJlbmRlcjooZGF0KSAtPlxyXG4gICAgICAgIEBwYXJlbnQuZGF0YSA9IGRhdFxyXG4gICAgICAgIHJlbmRlcl90YWJzKGxheW91dF9qc29uLCBkYXQsIHRoaXMsIEBwYXJlbnQpXHJcbiAgICAgIGJpbmQ6ICh0cGxfbmFtZSwgY2FsbGJhY2spIC0+XHJcbiAgICAgICAgaWYgbm90IEBwYXJlbnQuZXZlbnRzW3RwbF9uYW1lXVxyXG4gICAgICAgICAgQHBhcmVudC5ldmVudHNbdHBsX25hbWVdID0gW2NhbGxiYWNrXVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgIEBwYXJlbnQuZXZlbnRzW3RwbF9uYW1lXS5wdXNoIGNhbGxiYWNrXHJcbiAgICAgIGFjdGl2YXRlOiAodHBsX25hbWUpIC0+XHJcbiAgICAgICAgaWYgQHBhcmVudC5ldmVudHNbdHBsX25hbWVdXHJcbiAgICAgICAgICBmb3IgZSxpIGluIEBwYXJlbnQuZXZlbnRzW3RwbF9uYW1lXVxyXG4gICAgICAgICAgICBlIHRwbF9uYW1lLCBAcGFyZW50LmRhdGFcclxuXHJcbiAgbG9hZF90ZW1wbGF0ZToodGVtcGxhdGVfbmFtZSwgdXJsKSAtPlxyXG4gICAgJC5hamF4XHJcbiAgICAgIHVybDogdXJsXHJcbiAgICAgIGRhdGFUeXBlOiAnanNvbidcclxuICAgICAgY2FjaGU6IHRydWVcclxuICAgICAgc3VjY2VzczogKHRlbXBsYXRlX2pzb24pID0+XHJcbiAgICAgICAgQGFkZF90ZW1wbGF0ZSh0ZW1wbGF0ZV9uYW1lLCB0ZW1wbGF0ZV9qc29uKVxyXG4gICAgICAgIHJldHVyblxyXG5cclxuICBsb2FkX2Z1c2lvbl90ZW1wbGF0ZToodGVtcGxhdGVfbmFtZSwgdXJsKSAtPlxyXG4gICAgJC5hamF4XHJcbiAgICAgIHVybDogdXJsXHJcbiAgICAgIGRhdGFUeXBlOiAnanNvbidcclxuICAgICAgY2FjaGU6IHRydWVcclxuICAgICAgc3VjY2VzczogKHRlbXBsYXRlX2pzb24pID0+XHJcbiAgICAgICAgdCA9IGNvbnZlcnRfZnVzaW9uX3RlbXBsYXRlIHRlbXBsYXRlX2pzb25cclxuICAgICAgICBAYWRkX3RlbXBsYXRlKHRlbXBsYXRlX25hbWUsIHQpXHJcbiAgICAgICAgcmV0dXJuXHJcblxyXG5cclxuICBnZXRfbmFtZXM6IC0+XHJcbiAgICAodC5uYW1lIGZvciB0IGluIEBsaXN0KVxyXG5cclxuICBnZXRfaW5kZXhfYnlfbmFtZTogKG5hbWUpIC0+XHJcbiAgICBmb3IgdCxpIGluIEBsaXN0XHJcbiAgICAgIGlmIHQubmFtZSBpcyBuYW1lXHJcbiAgICAgICAgcmV0dXJuIGlcclxuICAgICByZXR1cm4gLTFcclxuXHJcbiAgZ2V0X2h0bWw6IChpbmQsIGRhdGEpIC0+XHJcbiAgICBpZiAoaW5kIGlzIC0xKSB0aGVuIHJldHVybiAgXCJcIlxyXG4gICAgXHJcbiAgICBpZiBAbGlzdFtpbmRdXHJcbiAgICAgIHJldHVybiBAbGlzdFtpbmRdLnJlbmRlcihkYXRhKVxyXG4gICAgZWxzZVxyXG4gICAgICByZXR1cm4gXCJcIlxyXG5cclxuICBhY3RpdmF0ZTogKGluZCwgdHBsX25hbWUpIC0+XHJcbiAgICBpZiBAbGlzdFtpbmRdXHJcbiAgICAgIEBsaXN0W2luZF0uYWN0aXZhdGUgdHBsX25hbWVcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVGVtcGxhdGVzMlxyXG4iXX0=
