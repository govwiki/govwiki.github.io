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
      minLength: 1,
      classNames: {
        menu: 'tt-dropdown-menu'
      }
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
var GovSelector, Templates2, activate_tab, active_tab, adjust_typeahead_width, build_select_element, build_selector, focus_search_field, get_elected_officials, get_financial_statements, get_record, get_record2, gov_selector, govmap, livereload, start_adjusting_typeahead_width, templates;

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
        get_financial_statements(data._id, function(data2, textStatus, jqXHR) {
          data.financial_statements = data2;
          return get_elected_officials(data._id, 25, function(data3, textStatus2, jqXHR2) {
            data.elected_officials = data3;
            $('#details').html(templates.get_html(0, data));
            return activate_tab();
          });
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

get_financial_statements = function(gov_id, onsuccess) {
  return $.ajax({
    url: "http://46.101.3.79:80/rest/db/_proc/get_financial_statements",
    data: {
      app_name: "govwiki",
      order: "caption_category,display_order",
      params: [
        {
          name: "govs_id",
          param_type: "IN",
          value: gov_id
        }
      ]
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
var Templates2, add_other_tab_to_layout, convert_fusion_template, fieldNames, get_layout_fields, get_record_fields, get_unmentioned_fields, render_field, render_field_name, render_field_value, render_fields, render_financial_fields, render_tabs, under;

fieldNames = {};

render_field_value = function(n, mask, data) {
  var v;
  v = data[n];
  if (!data[n]) {
    return '';
  }
  if (n === "web_site") {
    return "<a target='_blank' href='" + v + "'>" + v + "</a>";
  } else {
    if ('' !== mask) {
      return numeral(v).format(mask);
    } else {
      return v;
    }
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
    if (typeof field === "object") {
      fValue = render_field_value(field.name, field.mask, data);
      if ('' !== fValue) {
        fName = render_field_name(field.name);
      }
    } else {
      fValue = render_field_value(field, '', data);
      if ('' !== fValue) {
        fName = render_field_name(field);
      }
    }
    if ('' !== fValue) {
      h += template({
        name: fName,
        value: fValue
      });
    }
  }
  return h;
};

render_financial_fields = function(data, template) {
  var category, field, h, j, len, mask;
  h = '';
  mask = '$0,0.00';
  category = '';
  for (j = 0, len = data.length; j < len; j++) {
    field = data[j];
    if (category !== field.category_name) {
      category = field.category_name;
      h += template({
        name: "<b>" + category + "</b>",
        genfund: '',
        otherfunds: '',
        totalfunds: ''
      });
    }
    h += template({
      name: "<i>" + field.caption + "</i>",
      genfund: numeral(field.genfund).format(mask),
      otherfunds: numeral(field.otherfunds).format(mask),
      totalfunds: numeral(field.totalfunds).format(mask)
    });
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
              minTickSize: 1,
              labelWidth: 100
            },
            yaxis: {
              tickFormatter: function(val, axis) {
                return '';
              }
            },
            series: {
              bars: {
                show: true,
                barWidth: .4,
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
      case 'Financial Health':
        h = '';
        h += render_fields(tab.fields, data, templates['tabdetail-namevalue-template']);
        detail_data.tabcontent += templates['tabdetail-financial-health-template']({
          content: h
        });
        tabset.bind(tab.name, function(tpl_name, data) {
          var options, plot_spec;
          options = {
            series: {
              pie: {
                show: true
              }
            }
          };
          if (!plot_handles['public-safety-pie']) {
            plot_spec = [
              {
                label: 'Public safety expense',
                data: data['public_safety_exp_over_tot_gov_fund_revenue']
              }, {
                label: 'Other gov. fund revenue',
                data: 100 - data['public_safety_exp_over_tot_gov_fund_revenue']
              }
            ];
            return plot_handles['public-safety-pie'] = $("#public-safety-pie").plot(plot_spec, options);
          }
        });
        break;
      case 'Financial Statements':
        if (data.financial_statements) {
          h = '';
          h += render_financial_fields(data.financial_statements, templates['tabdetail-finstatement-template']);
          detail_data.tabcontent += templates['tabdetail-financial-statements-template']({
            content: h
          });
        }
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
  var categories, category, col_hash, fieldname, fields, get_col_hash, hash_to_array, i, j, len, len1, len2, m, o, obj, placeholder_count, ref, ref1, row, tab_hash, tabs, val;
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
        name: fieldname,
        fmt: val('mask', row, col_hash)
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
    tab_hash[category] = fields;
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
    templateList = ['tabpanel-template', 'tabdetail-template', 'tabdetail-namevalue-template', 'tabdetail-finstatement-template', 'tabdetail-official-template', 'tabdetail-employee-comp-template', 'tabdetail-financial-health-template', 'tabdetail-financial-statements-template'];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJDOlxcd3d3cm9vdFxcZ292d2lraS1kZXYudXNcXGNvZmZlZVxcZ292bWFwLmNvZmZlZSIsIkM6XFx3d3dyb290XFxnb3Z3aWtpLWRldi51c1xcY29mZmVlXFxnb3ZzZWxlY3Rvci5jb2ZmZWUiLCJDOlxcd3d3cm9vdFxcZ292d2lraS1kZXYudXNcXGNvZmZlZVxcbWFpbi5jb2ZmZWUiLCJDOlxcd3d3cm9vdFxcZ292d2lraS1kZXYudXNcXGNvZmZlZVxccXVlcnltYXRjaGVyLmNvZmZlZSIsIkM6XFx3d3dyb290XFxnb3Z3aWtpLWRldi51c1xcY29mZmVlXFx0ZW1wbGF0ZXMyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLElBQUEsNEtBQUE7O0FBQUEsY0FBQSxHQUFlLE1BQWYsQ0FBQTs7QUFBQSxHQUdBLEdBQVUsSUFBQSxLQUFBLENBQ1I7QUFBQSxFQUFBLEVBQUEsRUFBSSxTQUFKO0FBQUEsRUFDQSxHQUFBLEVBQUssVUFETDtBQUFBLEVBRUEsR0FBQSxFQUFLLENBQUEsV0FGTDtBQUFBLEVBR0EsSUFBQSxFQUFLLENBSEw7QUFBQSxFQUlBLFdBQUEsRUFBYSxLQUpiO0FBQUEsRUFLQSxVQUFBLEVBQVksS0FMWjtBQUFBLEVBTUEsV0FBQSxFQUFhLElBTmI7QUFBQSxFQU9BLGtCQUFBLEVBQ0U7QUFBQSxJQUFBLEtBQUEsRUFBTyxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQXBDO0dBUkY7QUFBQSxFQVNBLGNBQUEsRUFBZ0IsU0FBQSxHQUFBO1dBQ2QsdUJBQUEsQ0FBd0IsR0FBeEIsRUFEYztFQUFBLENBVGhCO0NBRFEsQ0FIVixDQUFBOztBQUFBLHVCQWlCQSxHQUEyQixTQUFDLElBQUQsR0FBQTtBQUN6QixFQUFBLFlBQUEsQ0FBYSxjQUFiLENBQUEsQ0FBQTtTQUNBLGNBQUEsR0FB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QUE7O0lBOVJGLENBQUE7O0FBQUEsTUF3V00sQ0FBQyxPQUFQLEdBQWlCLFVBeFdqQixDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImJvdW5kc190aW1lb3V0PXVuZGVmaW5lZFxyXG5cclxuXHJcbm1hcCA9IG5ldyBHTWFwc1xyXG4gIGVsOiAnI2dvdm1hcCdcclxuICBsYXQ6IDM3LjM3ODkwMDhcclxuICBsbmc6IC0xMTcuMTkxNjI4M1xyXG4gIHpvb206NlxyXG4gIHNjcm9sbHdoZWVsOiBmYWxzZVxyXG4gIHBhbkNvbnRyb2w6IGZhbHNlXHJcbiAgem9vbUNvbnRyb2w6IHRydWVcclxuICB6b29tQ29udHJvbE9wdGlvbnM6XHJcbiAgICBzdHlsZTogZ29vZ2xlLm1hcHMuWm9vbUNvbnRyb2xTdHlsZS5TTUFMTFxyXG4gIGJvdW5kc19jaGFuZ2VkOiAtPlxyXG4gICAgb25fYm91bmRzX2NoYW5nZWRfbGF0ZXIgMjAwXHJcblxyXG5cclxub25fYm91bmRzX2NoYW5nZWRfbGF0ZXIgID0gKG1zZWMpICAtPlxyXG4gIGNsZWFyVGltZW91dCBib3VuZHNfdGltZW91dFxyXG4gIGJvdW5kc190aW1lb3V0ID0gc2V0VGltZW91dCBvbl9ib3VuZHNfY2hhbmdlZCwgbXNlY1xyXG5cclxuICAgIFxyXG5vbl9ib3VuZHNfY2hhbmdlZCA9KGUpIC0+XHJcbiAgY29uc29sZS5sb2cgXCJib3VuZHNfY2hhbmdlZFwiXHJcbiAgYj1tYXAuZ2V0Qm91bmRzKClcclxuICB1cmxfdmFsdWU9Yi50b1VybFZhbHVlKClcclxuICBuZT1iLmdldE5vcnRoRWFzdCgpXHJcbiAgc3c9Yi5nZXRTb3V0aFdlc3QoKVxyXG4gIG5lX2xhdD1uZS5sYXQoKVxyXG4gIG5lX2xuZz1uZS5sbmcoKVxyXG4gIHN3X2xhdD1zdy5sYXQoKVxyXG4gIHN3X2xuZz1zdy5sbmcoKVxyXG4gIHN0ID0gR09WV0lLSS5zdGF0ZV9maWx0ZXJcclxuICB0eSA9IEdPVldJS0kuZ292X3R5cGVfZmlsdGVyXHJcblxyXG4gICMjI1xyXG4gICMgQnVpbGQgdGhlIHF1ZXJ5LlxyXG4gIHE9XCJcIlwiIFwibGF0aXR1ZGVcIjp7XCIkbHRcIjoje25lX2xhdH0sXCIkZ3RcIjoje3N3X2xhdH19LFwibG9uZ2l0dWRlXCI6e1wiJGx0XCI6I3tuZV9sbmd9LFwiJGd0XCI6I3tzd19sbmd9fVwiXCJcIlxyXG4gICMgQWRkIGZpbHRlcnMgaWYgdGhleSBleGlzdFxyXG4gIHErPVwiXCJcIixcInN0YXRlXCI6XCIje3N0fVwiIFwiXCJcIiBpZiBzdFxyXG4gIHErPVwiXCJcIixcImdvdl90eXBlXCI6XCIje3R5fVwiIFwiXCJcIiBpZiB0eVxyXG5cclxuXHJcbiAgZ2V0X3JlY29yZHMgcSwgMjAwLCAgKGRhdGEpIC0+XHJcbiAgICAjY29uc29sZS5sb2cgXCJsZW5ndGg9I3tkYXRhLmxlbmd0aH1cIlxyXG4gICAgI2NvbnNvbGUubG9nIFwibGF0OiAje25lX2xhdH0sI3tzd19sYXR9IGxuZzogI3tuZV9sbmd9LCAje3N3X2xuZ31cIlxyXG4gICAgbWFwLnJlbW92ZU1hcmtlcnMoKVxyXG4gICAgYWRkX21hcmtlcihyZWMpIGZvciByZWMgaW4gZGF0YVxyXG4gICAgcmV0dXJuXHJcbiAgIyMjXHJcblxyXG4gICMgQnVpbGQgdGhlIHF1ZXJ5IDIuXHJcbiAgcTI9XCJcIlwiIGxhdGl0dWRlPCN7bmVfbGF0fSBBTkQgbGF0aXR1ZGU+I3tzd19sYXR9IEFORCBsb25naXR1ZGU8I3tuZV9sbmd9IEFORCBsb25naXR1ZGU+I3tzd19sbmd9IFwiXCJcIlxyXG4gICMgQWRkIGZpbHRlcnMgaWYgdGhleSBleGlzdFxyXG4gIHEyKz1cIlwiXCIgQU5EIHN0YXRlPVwiI3tzdH1cIiBcIlwiXCIgaWYgc3RcclxuICBxMis9XCJcIlwiIEFORCBnb3ZfdHlwZT1cIiN7dHl9XCIgXCJcIlwiIGlmIHR5XHJcblxyXG5cclxuICBnZXRfcmVjb3JkczIgcTIsIDIwMCwgIChkYXRhKSAtPlxyXG4gICAgI2NvbnNvbGUubG9nIFwibGVuZ3RoPSN7ZGF0YS5sZW5ndGh9XCJcclxuICAgICNjb25zb2xlLmxvZyBcImxhdDogI3tuZV9sYXR9LCN7c3dfbGF0fSBsbmc6ICN7bmVfbG5nfSwgI3tzd19sbmd9XCJcclxuICAgIG1hcC5yZW1vdmVNYXJrZXJzKClcclxuICAgIGFkZF9tYXJrZXIocmVjKSBmb3IgcmVjIGluIGRhdGEucmVjb3JkXHJcbiAgICByZXR1cm5cclxuXHJcblxyXG5cclxuZ2V0X2ljb24gPShnb3ZfdHlwZSkgLT5cclxuICBcclxuICBfY2lyY2xlID0oY29sb3IpLT5cclxuICAgIHBhdGg6IGdvb2dsZS5tYXBzLlN5bWJvbFBhdGguQ0lSQ0xFXHJcbiAgICBmaWxsT3BhY2l0eTogMC41XHJcbiAgICBmaWxsQ29sb3I6Y29sb3JcclxuICAgIHN0cm9rZVdlaWdodDogMVxyXG4gICAgc3Ryb2tlQ29sb3I6J3doaXRlJ1xyXG4gICAgI3N0cm9rZVBvc2l0aW9uOiBnb29nbGUubWFwcy5TdHJva2VQb3NpdGlvbi5PVVRTSURFXHJcbiAgICBzY2FsZTo2XHJcblxyXG4gIHN3aXRjaCBnb3ZfdHlwZVxyXG4gICAgd2hlbiAnR2VuZXJhbCBQdXJwb3NlJyB0aGVuIHJldHVybiBfY2lyY2xlICcjMDNDJ1xyXG4gICAgd2hlbiAnQ2VtZXRlcmllcycgICAgICB0aGVuIHJldHVybiBfY2lyY2xlICcjMDAwJ1xyXG4gICAgd2hlbiAnSG9zcGl0YWxzJyAgICAgICB0aGVuIHJldHVybiBfY2lyY2xlICcjMEMwJ1xyXG4gICAgZWxzZSByZXR1cm4gX2NpcmNsZSAnI0QyMCdcclxuXHJcblxyXG5cclxuXHJcbmFkZF9tYXJrZXIgPShyZWMpLT5cclxuICAjY29uc29sZS5sb2cgXCIje3JlYy5yYW5kfSAje3JlYy5pbmNfaWR9ICN7cmVjLnppcH0gI3tyZWMubGF0aXR1ZGV9ICN7cmVjLmxvbmdpdHVkZX0gI3tyZWMuZ292X25hbWV9XCJcclxuICBtYXAuYWRkTWFya2VyXHJcbiAgICBsYXQ6IHJlYy5sYXRpdHVkZVxyXG4gICAgbG5nOiByZWMubG9uZ2l0dWRlXHJcbiAgICBpY29uOiBnZXRfaWNvbihyZWMuZ292X3R5cGUpXHJcbiAgICB0aXRsZTogIFwiI3tyZWMuZ292X25hbWV9LCAje3JlYy5nb3ZfdHlwZX0gKCN7cmVjLmxhdGl0dWRlfSwgI3tyZWMubG9uZ2l0dWRlfSlcIlxyXG4gICAgaW5mb1dpbmRvdzpcclxuICAgICAgY29udGVudDogY3JlYXRlX2luZm9fd2luZG93IHJlY1xyXG4gICAgY2xpY2s6IChlKS0+XHJcbiAgICAgICN3aW5kb3cuR09WV0lLSS5zaG93X3JlY29yZCByZWNcclxuICAgICAgd2luZG93LkdPVldJS0kuc2hvd19yZWNvcmQyIHJlY1xyXG4gIFxyXG4gIHJldHVyblxyXG5cclxuXHJcbmNyZWF0ZV9pbmZvX3dpbmRvdyA9KHIpIC0+XHJcbiAgdyA9ICQoJzxkaXY+PC9kaXY+JylcclxuICAuYXBwZW5kICQoXCI8YSBocmVmPScjJz48c3Ryb25nPiN7ci5nb3ZfbmFtZX08L3N0cm9uZz48L2E+XCIpLmNsaWNrIChlKS0+XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgIGNvbnNvbGUubG9nIHJcclxuICAgICN3aW5kb3cuR09WV0lLSS5zaG93X3JlY29yZCByXHJcbiAgICB3aW5kb3cuR09WV0lLSS5zaG93X3JlY29yZDIgclxyXG5cclxuICAuYXBwZW5kICQoXCI8ZGl2PiAje3IuZ292X3R5cGV9ICAje3IuY2l0eX0gI3tyLnppcH0gI3tyLnN0YXRlfTwvZGl2PlwiKVxyXG4gIHJldHVybiB3WzBdXHJcblxyXG5cclxuXHJcblxyXG5nZXRfcmVjb3JkcyA9IChxdWVyeSwgbGltaXQsIG9uc3VjY2VzcykgLT5cclxuICAkLmFqYXhcclxuICAgIHVybDogXCJodHRwczovL2FwaS5tb25nb2xhYi5jb20vYXBpLzEvZGF0YWJhc2VzL2dvdndpa2kvY29sbGVjdGlvbnMvZ292cy8/cT17I3txdWVyeX19JmY9e19pZDowfSZsPSN7bGltaXR9JnM9e3JhbmQ6MX0mYXBpS2V5PTBZNVhfUWsydU9KUmRISldKS1NSV2s2bDZKcVZUUzJ5XCJcclxuICAgIGRhdGFUeXBlOiAnanNvbidcclxuICAgIGNhY2hlOiB0cnVlXHJcbiAgICBzdWNjZXNzOiBvbnN1Y2Nlc3NcclxuICAgIGVycm9yOihlKSAtPlxyXG4gICAgICBjb25zb2xlLmxvZyBlXHJcblxyXG5cclxuZ2V0X3JlY29yZHMyID0gKHF1ZXJ5LCBsaW1pdCwgb25zdWNjZXNzKSAtPlxyXG4gICQuYWpheFxyXG4gICAgdXJsOlwiaHR0cDovLzQ2LjEwMS4zLjc5OjgwL3Jlc3QvZGIvZ292c1wiXHJcbiAgICBkYXRhOlxyXG4gICAgICAjZmlsdGVyOlwibGF0aXR1ZGU+MzIgQU5EIGxhdGl0dWRlPDM0IEFORCBsb25naXR1ZGU+LTg3IEFORCBsb25naXR1ZGU8LTg2XCJcclxuICAgICAgZmlsdGVyOnF1ZXJ5XHJcbiAgICAgIGZpZWxkczpcIl9pZCxpbmNfaWQsZ292X25hbWUsZ292X3R5cGUsY2l0eSx6aXAsc3RhdGUsbGF0aXR1ZGUsbG9uZ2l0dWRlXCJcclxuICAgICAgYXBwX25hbWU6XCJnb3Z3aWtpXCJcclxuICAgICAgb3JkZXI6XCJyYW5kXCJcclxuICAgICAgbGltaXQ6bGltaXRcclxuXHJcbiAgICBkYXRhVHlwZTogJ2pzb24nXHJcbiAgICBjYWNoZTogdHJ1ZVxyXG4gICAgc3VjY2Vzczogb25zdWNjZXNzXHJcbiAgICBlcnJvcjooZSkgLT5cclxuICAgICAgY29uc29sZS5sb2cgZVxyXG5cclxuIyBHRU9DT0RJTkcgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5cclxucGluSW1hZ2UgPSBuZXcgKGdvb2dsZS5tYXBzLk1hcmtlckltYWdlKShcclxuICAnaHR0cDovL2NoYXJ0LmFwaXMuZ29vZ2xlLmNvbS9jaGFydD9jaHN0PWRfbWFwX3Bpbl9sZXR0ZXImY2hsZD1afDc3NzdCQnxGRkZGRkYnICxcclxuICBuZXcgKGdvb2dsZS5tYXBzLlNpemUpKDIxLCAzNCksXHJcbiAgbmV3IChnb29nbGUubWFwcy5Qb2ludCkoMCwgMCksXHJcbiAgbmV3IChnb29nbGUubWFwcy5Qb2ludCkoMTAsIDM0KVxyXG4gIClcclxuXHJcblxyXG5nZW9jb2RlX2FkZHIgPSAoYWRkcixkYXRhKSAtPlxyXG4gIEdNYXBzLmdlb2NvZGVcclxuICAgIGFkZHJlc3M6IGFkZHJcclxuICAgIGNhbGxiYWNrOiAocmVzdWx0cywgc3RhdHVzKSAtPlxyXG4gICAgICBpZiBzdGF0dXMgPT0gJ09LJ1xyXG4gICAgICAgIGxhdGxuZyA9IHJlc3VsdHNbMF0uZ2VvbWV0cnkubG9jYXRpb25cclxuICAgICAgICBtYXAuc2V0Q2VudGVyIGxhdGxuZy5sYXQoKSwgbGF0bG5nLmxuZygpXHJcbiAgICAgICAgbWFwLmFkZE1hcmtlclxyXG4gICAgICAgICAgbGF0OiBsYXRsbmcubGF0KClcclxuICAgICAgICAgIGxuZzogbGF0bG5nLmxuZygpXHJcbiAgICAgICAgICBzaXplOiAnc21hbGwnXHJcbiAgICAgICAgICB0aXRsZTogcmVzdWx0c1swXS5mb3JtYXR0ZWRfYWRkcmVzc1xyXG4gICAgICAgICAgaW5mb1dpbmRvdzpcclxuICAgICAgICAgICAgY29udGVudDogcmVzdWx0c1swXS5mb3JtYXR0ZWRfYWRkcmVzc1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIGRhdGFcclxuICAgICAgICAgIG1hcC5hZGRNYXJrZXJcclxuICAgICAgICAgICAgbGF0OiBkYXRhLmxhdGl0dWRlXHJcbiAgICAgICAgICAgIGxuZzogZGF0YS5sb25naXR1ZGVcclxuICAgICAgICAgICAgc2l6ZTogJ3NtYWxsJ1xyXG4gICAgICAgICAgICBjb2xvcjogJ2JsdWUnXHJcbiAgICAgICAgICAgIGljb246IHBpbkltYWdlXHJcbiAgICAgICAgICAgIHRpdGxlOiAgXCIje2RhdGEubGF0aXR1ZGV9ICN7ZGF0YS5sb25naXR1ZGV9XCJcclxuICAgICAgICAgICAgaW5mb1dpbmRvdzpcclxuICAgICAgICAgICAgICBjb250ZW50OiBcIiN7ZGF0YS5sYXRpdHVkZX0gI3tkYXRhLmxvbmdpdHVkZX1cIlxyXG4gICAgICAgICAgICBcclxuICAgICAgICAkKCcuZ292bWFwLWZvdW5kJykuaHRtbCBcIjxzdHJvbmc+Rk9VTkQ6IDwvc3Ryb25nPiN7cmVzdWx0c1swXS5mb3JtYXR0ZWRfYWRkcmVzc31cIlxyXG4gICAgICByZXR1cm5cclxuXHJcblxyXG5jbGVhcj0ocyktPlxyXG4gIHJldHVybiBpZiBzLm1hdGNoKC8gYm94IC9pKSB0aGVuICcnIGVsc2Ugc1xyXG5cclxuZ2VvY29kZSA9IChkYXRhKSAtPlxyXG4gIGFkZHIgPSBcIiN7Y2xlYXIoZGF0YS5hZGRyZXNzMSl9ICN7Y2xlYXIoZGF0YS5hZGRyZXNzMil9LCAje2RhdGEuY2l0eX0sICN7ZGF0YS5zdGF0ZX0gI3tkYXRhLnppcH0sIFVTQVwiXHJcbiAgJCgnI2dvdmFkZHJlc3MnKS52YWwoYWRkcilcclxuICBnZW9jb2RlX2FkZHIgYWRkciwgZGF0YVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID1cclxuICBnZW9jb2RlOiBnZW9jb2RlXHJcbiAgZ29jb2RlX2FkZHI6IGdlb2NvZGVfYWRkclxyXG4gIG9uX2JvdW5kc19jaGFuZ2VkOiBvbl9ib3VuZHNfY2hhbmdlZFxyXG4gIG9uX2JvdW5kc19jaGFuZ2VkX2xhdGVyOiBvbl9ib3VuZHNfY2hhbmdlZF9sYXRlclxyXG4iLCJcclxucXVlcnlfbWF0Y2hlciA9IHJlcXVpcmUoJy4vcXVlcnltYXRjaGVyLmNvZmZlZScpXHJcblxyXG5jbGFzcyBHb3ZTZWxlY3RvclxyXG4gIFxyXG4gICMgc3R1YiBvZiBhIGNhbGxiYWNrIHRvIGVudm9rZSB3aGVuIHRoZSB1c2VyIHNlbGVjdHMgc29tZXRoaW5nXHJcbiAgb25fc2VsZWN0ZWQ6IChldnQsIGRhdGEsIG5hbWUpIC0+XHJcblxyXG5cclxuICBjb25zdHJ1Y3RvcjogKEBodG1sX3NlbGVjdG9yLCBkb2NzX3VybCwgQG51bV9pdGVtcykgLT5cclxuICAgICQuYWpheFxyXG4gICAgICB1cmw6IGRvY3NfdXJsXHJcbiAgICAgIGRhdGFUeXBlOiAnanNvbidcclxuICAgICAgY2FjaGU6IHRydWVcclxuICAgICAgc3VjY2VzczogQHN0YXJ0U3VnZ2VzdGlvblxyXG4gICAgICBcclxuXHJcblxyXG5cclxuICBzdWdnZXN0aW9uVGVtcGxhdGUgOiBIYW5kbGViYXJzLmNvbXBpbGUoXCJcIlwiXHJcbiAgICA8ZGl2IGNsYXNzPVwic3VnZy1ib3hcIj5cclxuICAgICAgPGRpdiBjbGFzcz1cInN1Z2ctc3RhdGVcIj57e3tzdGF0ZX19fTwvZGl2PlxyXG4gICAgICA8ZGl2IGNsYXNzPVwic3VnZy1uYW1lXCI+e3t7Z292X25hbWV9fX08L2Rpdj5cclxuICAgICAgPGRpdiBjbGFzcz1cInN1Z2ctdHlwZVwiPnt7e2dvdl90eXBlfX19PC9kaXY+XHJcbiAgICA8L2Rpdj5cIlwiXCIpXHJcblxyXG5cclxuXHJcbiAgZW50ZXJlZF92YWx1ZSA9IFwiXCJcclxuXHJcbiAgZ292c19hcnJheSA9IFtdXHJcblxyXG4gIGNvdW50X2dvdnMgOiAoKSAtPlxyXG4gICAgY291bnQgPTBcclxuICAgIGZvciBkIGluIEBnb3ZzX2FycmF5XHJcbiAgICAgIGlmIEdPVldJS0kuc3RhdGVfZmlsdGVyIGFuZCBkLnN0YXRlIGlzbnQgR09WV0lLSS5zdGF0ZV9maWx0ZXIgdGhlbiBjb250aW51ZVxyXG4gICAgICBpZiBHT1ZXSUtJLmdvdl90eXBlX2ZpbHRlciBhbmQgZC5nb3ZfdHlwZSBpc250IEdPVldJS0kuZ292X3R5cGVfZmlsdGVyIHRoZW4gY29udGludWVcclxuICAgICAgY291bnQrK1xyXG4gICAgcmV0dXJuIGNvdW50XHJcblxyXG5cclxuICBzdGFydFN1Z2dlc3Rpb24gOiAoZ292cykgPT5cclxuICAgICNAZ292c19hcnJheSA9IGdvdnNcclxuICAgIEBnb3ZzX2FycmF5ID0gZ292cy5yZWNvcmRcclxuICAgICQoJy50eXBlYWhlYWQnKS5rZXl1cCAoZXZlbnQpID0+XHJcbiAgICAgIEBlbnRlcmVkX3ZhbHVlID0gJChldmVudC50YXJnZXQpLnZhbCgpXHJcbiAgICBcclxuICAgICQoQGh0bWxfc2VsZWN0b3IpLmF0dHIgJ3BsYWNlaG9sZGVyJywgJ0dPVkVSTk1FTlQgTkFNRSdcclxuICAgICQoQGh0bWxfc2VsZWN0b3IpLnR5cGVhaGVhZChcclxuICAgICAgICBoaW50OiBmYWxzZVxyXG4gICAgICAgIGhpZ2hsaWdodDogZmFsc2VcclxuICAgICAgICBtaW5MZW5ndGg6IDFcclxuICAgICAgICBjbGFzc05hbWVzOlxyXG4gICAgICAgIFx0bWVudTogJ3R0LWRyb3Bkb3duLW1lbnUnXHJcbiAgICAgICxcclxuICAgICAgICBuYW1lOiAnZ292X25hbWUnXHJcbiAgICAgICAgZGlzcGxheUtleTogJ2dvdl9uYW1lJ1xyXG4gICAgICAgIHNvdXJjZTogcXVlcnlfbWF0Y2hlcihAZ292c19hcnJheSwgQG51bV9pdGVtcylcclxuICAgICAgICAjc291cmNlOiBibG9vZGhvdW5kLnR0QWRhcHRlcigpXHJcbiAgICAgICAgdGVtcGxhdGVzOiBzdWdnZXN0aW9uOiBAc3VnZ2VzdGlvblRlbXBsYXRlXHJcbiAgICApXHJcbiAgICAub24gJ3R5cGVhaGVhZDpzZWxlY3RlZCcsICAoZXZ0LCBkYXRhLCBuYW1lKSA9PlxyXG4gICAgICAgICQoJy50eXBlYWhlYWQnKS50eXBlYWhlYWQgJ3ZhbCcsIEBlbnRlcmVkX3ZhbHVlXHJcbiAgICAgICAgQG9uX3NlbGVjdGVkKGV2dCwgZGF0YSwgbmFtZSlcclxuICAgXHJcbiAgICAub24gJ3R5cGVhaGVhZDpjdXJzb3JjaGFuZ2VkJywgKGV2dCwgZGF0YSwgbmFtZSkgPT5cclxuICAgICAgICAkKCcudHlwZWFoZWFkJykudmFsIEBlbnRlcmVkX3ZhbHVlXHJcbiAgICBcclxuXHJcbiAgICAkKCcuZ292LWNvdW50ZXInKS50ZXh0IEBjb3VudF9nb3ZzKClcclxuICAgIHJldHVyblxyXG5cclxuXHJcblxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzPUdvdlNlbGVjdG9yXHJcblxyXG5cclxuXHJcbiIsIiMjI1xyXG5maWxlOiBtYWluLmNvZmZlIC0tIFRoZSBlbnRyeSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gIDpcclxuZ292X2ZpbmRlciA9IG5ldyBHb3ZGaW5kZXJcclxuZ292X2RldGFpbHMgPSBuZXcgR292RGV0YWlsc1xyXG5nb3ZfZmluZGVyLm9uX3NlbGVjdCA9IGdvdl9kZXRhaWxzLnNob3dcclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuIyMjXHJcblxyXG5Hb3ZTZWxlY3RvciA9IHJlcXVpcmUgJy4vZ292c2VsZWN0b3IuY29mZmVlJ1xyXG4jX2pxZ3MgICAgICAgPSByZXF1aXJlICcuL2pxdWVyeS5nb3ZzZWxlY3Rvci5jb2ZmZWUnXHJcblRlbXBsYXRlczIgICAgICA9IHJlcXVpcmUgJy4vdGVtcGxhdGVzMi5jb2ZmZWUnXHJcbmdvdm1hcCAgICAgID0gcmVxdWlyZSAnLi9nb3ZtYXAuY29mZmVlJ1xyXG4jc2Nyb2xsdG8gPSByZXF1aXJlICcuLi9ib3dlcl9jb21wb25lbnRzL2pxdWVyeS5zY3JvbGxUby9qcXVlcnkuc2Nyb2xsVG8uanMnXHJcblxyXG53aW5kb3cuR09WV0lLSSA9XHJcbiAgc3RhdGVfZmlsdGVyIDogJydcclxuICBnb3ZfdHlwZV9maWx0ZXIgOiAnJ1xyXG5cclxuICBzaG93X3NlYXJjaF9wYWdlOiAoKSAtPlxyXG4gICAgJCh3aW5kb3cpLnNjcm9sbFRvKCcwcHgnLDEwKVxyXG4gICAgJCgnI2RhdGFDb250YWluZXInKS5oaWRlKClcclxuICAgICQoJyNzZWFyY2hJY29uJykuaGlkZSgpXHJcbiAgICAkKCcjc2VhcmNoQ29udGFpbmVyJykuZmFkZUluKDMwMClcclxuICAgIGZvY3VzX3NlYXJjaF9maWVsZCA1MDBcclxuICAgIFxyXG4gIHNob3dfZGF0YV9wYWdlOiAoKSAtPlxyXG4gICAgJCh3aW5kb3cpLnNjcm9sbFRvKCcwcHgnLDEwKVxyXG4gICAgJCgnI3NlYXJjaEljb24nKS5zaG93KClcclxuICAgICQoJyNkYXRhQ29udGFpbmVyJykuZmFkZUluKDMwMClcclxuICAgICQoJyNzZWFyY2hDb250YWluZXInKS5oaWRlKClcclxuICAgICMkKHdpbmRvdykuc2Nyb2xsVG8oJyNwQmFja1RvU2VhcmNoJyw2MDApXHJcblxyXG5cclxuXHJcblxyXG4jZ292X3NlbGVjdG9yID0gbmV3IEdvdlNlbGVjdG9yICcudHlwZWFoZWFkJywgJ2RhdGEvaF90eXBlcy5qc29uJywgN1xyXG5nb3Zfc2VsZWN0b3IgPSBuZXcgR292U2VsZWN0b3IgJy50eXBlYWhlYWQnLCAnZGF0YS9oX3R5cGVzX2NhLmpzb24nLCA3XHJcbiNnb3Zfc2VsZWN0b3IgPSBuZXcgR292U2VsZWN0b3IgJy50eXBlYWhlYWQnLCAnaHR0cDovLzQ2LjEwMS4zLjc5L3Jlc3QvZGIvZ292cz9maWx0ZXI9c3RhdGU9JTIyQ0ElMjImYXBwX25hbWU9Z292d2lraSZmaWVsZHM9X2lkLGdvdl9uYW1lLGdvdl90eXBlLHN0YXRlJywgN1xyXG50ZW1wbGF0ZXMgPSBuZXcgVGVtcGxhdGVzMlxyXG5hY3RpdmVfdGFiPVwiXCJcclxuXHJcbndpbmRvdy5yZW1lbWJlcl90YWIgPShuYW1lKS0+IGFjdGl2ZV90YWIgPSBuYW1lXHJcblxyXG4jd2luZG93Lmdlb2NvZGVfYWRkciA9IChpbnB1dF9zZWxlY3RvciktPiBnb3ZtYXAuZ29jb2RlX2FkZHIgJChpbnB1dF9zZWxlY3RvcikudmFsKClcclxuXHJcbiQoZG9jdW1lbnQpLm9uICdjbGljaycsICcjZmllbGRUYWJzIGEnLCAoZSkgLT5cclxuICBhY3RpdmVfdGFiID0gJChlLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ3RhYm5hbWUnKVxyXG4gIGNvbnNvbGUubG9nIGFjdGl2ZV90YWJcclxuICAkKFwiI3RhYnNDb250ZW50IC50YWItcGFuZVwiKS5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKVxyXG4gICQoJChlLmN1cnJlbnRUYXJnZXQpLmF0dHIoJ2hyZWYnKSkuYWRkQ2xhc3MoXCJhY3RpdmVcIilcclxuICB0ZW1wbGF0ZXMuYWN0aXZhdGUgMCwgYWN0aXZlX3RhYlxyXG5cclxuYWN0aXZhdGVfdGFiID0oKSAtPlxyXG4gICQoXCIjZmllbGRUYWJzIGFbaHJlZj0nI3RhYiN7YWN0aXZlX3RhYn0nXVwiKS50YWIoJ3Nob3cnKVxyXG5cclxuXHJcbmdvdl9zZWxlY3Rvci5vbl9zZWxlY3RlZCA9IChldnQsIGRhdGEsIG5hbWUpIC0+XHJcbiAgI3JlbmRlckRhdGEgJyNkZXRhaWxzJywgZGF0YVxyXG4gIGdldF9lbGVjdGVkX29mZmljaWFscyBkYXRhLl9pZCwgMjUsIChkYXRhMiwgdGV4dFN0YXR1cywganFYSFIpIC0+XHJcbiAgICBkYXRhLmVsZWN0ZWRfb2ZmaWNpYWxzID0gZGF0YTJcclxuICAgICQoJyNkZXRhaWxzJykuaHRtbCB0ZW1wbGF0ZXMuZ2V0X2h0bWwoMCwgZGF0YSlcclxuICAgICNnZXRfcmVjb3JkIFwiaW5jX2lkOiN7ZGF0YVtcImluY19pZFwiXX1cIlxyXG4gICAgZ2V0X3JlY29yZDIgZGF0YVtcIl9pZFwiXVxyXG4gICAgYWN0aXZhdGVfdGFiKClcclxuICAgIEdPVldJS0kuc2hvd19kYXRhX3BhZ2UoKVxyXG4gICAgcmV0dXJuXHJcblxyXG5cclxuZ2V0X3JlY29yZCA9IChxdWVyeSkgLT5cclxuICAkLmFqYXhcclxuICAgIHVybDogXCJodHRwczovL2FwaS5tb25nb2xhYi5jb20vYXBpLzEvZGF0YWJhc2VzL2dvdndpa2kvY29sbGVjdGlvbnMvZ292cy8/cT17I3txdWVyeX19JmY9e19pZDowfSZsPTEmYXBpS2V5PTBZNVhfUWsydU9KUmRISldKS1NSV2s2bDZKcVZUUzJ5XCJcclxuICAgIGRhdGFUeXBlOiAnanNvbidcclxuICAgIGNhY2hlOiB0cnVlXHJcbiAgICBzdWNjZXNzOiAoZGF0YSkgLT5cclxuICAgICAgaWYgZGF0YS5sZW5ndGhcclxuICAgICAgICAkKCcjZGV0YWlscycpLmh0bWwgdGVtcGxhdGVzLmdldF9odG1sKDAsIGRhdGFbMF0pXHJcbiAgICAgICAgYWN0aXZhdGVfdGFiKClcclxuICAgICAgICAjZ292bWFwLmdlb2NvZGUgZGF0YVswXVxyXG4gICAgICByZXR1cm5cclxuICAgIGVycm9yOihlKSAtPlxyXG4gICAgICBjb25zb2xlLmxvZyBlXHJcblxyXG5cclxuZ2V0X3JlY29yZDIgPSAocmVjaWQpIC0+XHJcbiAgJC5hamF4XHJcbiAgICAjdXJsOiBcImh0dHBzOi8vZHNwLWdvdndpa2kuY2xvdWQuZHJlYW1mYWN0b3J5LmNvbTo0NDMvcmVzdC9nb3Z3aWtpX2FwaS9nb3ZzLyN7cmVjaWR9XCJcclxuICAgIHVybDogXCJodHRwOi8vNDYuMTAxLjMuNzk6ODAvcmVzdC9kYi9nb3ZzLyN7cmVjaWR9XCJcclxuICAgIGRhdGFUeXBlOiAnanNvbidcclxuICAgIGhlYWRlcnM6IHtcIlgtRHJlYW1GYWN0b3J5LUFwcGxpY2F0aW9uLU5hbWVcIjpcImdvdndpa2lcIn1cclxuICAgIGNhY2hlOiB0cnVlXHJcbiAgICBzdWNjZXNzOiAoZGF0YSkgLT5cclxuICAgICAgaWYgZGF0YVxyXG4gICAgICAgIGdldF9maW5hbmNpYWxfc3RhdGVtZW50cyBkYXRhLl9pZCwgKGRhdGEyLCB0ZXh0U3RhdHVzLCBqcVhIUikgLT5cclxuICAgICAgICAgIGRhdGEuZmluYW5jaWFsX3N0YXRlbWVudHMgPSBkYXRhMlxyXG4gICAgICAgICAgZ2V0X2VsZWN0ZWRfb2ZmaWNpYWxzIGRhdGEuX2lkLCAyNSwgKGRhdGEzLCB0ZXh0U3RhdHVzMiwganFYSFIyKSAtPlxyXG4gICAgICAgICAgICBkYXRhLmVsZWN0ZWRfb2ZmaWNpYWxzID0gZGF0YTNcclxuICAgICAgICAgICAgJCgnI2RldGFpbHMnKS5odG1sIHRlbXBsYXRlcy5nZXRfaHRtbCgwLCBkYXRhKVxyXG4gICAgICAgICAgICBhY3RpdmF0ZV90YWIoKVxyXG4gICAgICAgICAgICAjZ292bWFwLmdlb2NvZGUgZGF0YVswXVxyXG4gICAgICByZXR1cm5cclxuICAgIGVycm9yOihlKSAtPlxyXG4gICAgICBjb25zb2xlLmxvZyBlXHJcblxyXG5cclxuZ2V0X2VsZWN0ZWRfb2ZmaWNpYWxzID0gKGdvdl9pZCwgbGltaXQsIG9uc3VjY2VzcykgLT5cclxuICAkLmFqYXhcclxuICAgIHVybDpcImh0dHA6Ly80Ni4xMDEuMy43OTo4MC9yZXN0L2RiL2VsZWN0ZWRfb2ZmaWNpYWxzXCJcclxuICAgIGRhdGE6XHJcbiAgICAgIGZpbHRlcjpcImdvdnNfaWQ9XCIgKyBnb3ZfaWRcclxuICAgICAgZmllbGRzOlwiZ292c19pZCx0aXRsZSxmdWxsX25hbWUsZW1haWxfYWRkcmVzcyxwaG90b191cmwsdGVybV9leHBpcmVzXCJcclxuICAgICAgYXBwX25hbWU6XCJnb3Z3aWtpXCJcclxuICAgICAgb3JkZXI6XCJkaXNwbGF5X29yZGVyXCJcclxuICAgICAgbGltaXQ6bGltaXRcclxuXHJcbiAgICBkYXRhVHlwZTogJ2pzb24nXHJcbiAgICBjYWNoZTogdHJ1ZVxyXG4gICAgc3VjY2Vzczogb25zdWNjZXNzXHJcbiAgICBlcnJvcjooZSkgLT5cclxuICAgICAgY29uc29sZS5sb2cgZVxyXG5cclxuZ2V0X2ZpbmFuY2lhbF9zdGF0ZW1lbnRzID0gKGdvdl9pZCwgb25zdWNjZXNzKSAtPlxyXG4gICQuYWpheFxyXG4gICAgdXJsOlwiaHR0cDovLzQ2LjEwMS4zLjc5OjgwL3Jlc3QvZGIvX3Byb2MvZ2V0X2ZpbmFuY2lhbF9zdGF0ZW1lbnRzXCJcclxuICAgIGRhdGE6XHJcbiAgICAgIGFwcF9uYW1lOlwiZ292d2lraVwiXHJcbiAgICAgIG9yZGVyOlwiY2FwdGlvbl9jYXRlZ29yeSxkaXNwbGF5X29yZGVyXCJcclxuICAgICAgcGFyYW1zOiBbXHJcbiAgICAgICAgbmFtZTogXCJnb3ZzX2lkXCJcclxuICAgICAgICBwYXJhbV90eXBlOiBcIklOXCJcclxuICAgICAgICB2YWx1ZTogZ292X2lkXHJcbiAgICAgIF1cclxuXHJcbiAgICBkYXRhVHlwZTogJ2pzb24nXHJcbiAgICBjYWNoZTogdHJ1ZVxyXG4gICAgc3VjY2Vzczogb25zdWNjZXNzXHJcbiAgICBlcnJvcjooZSkgLT5cclxuICAgICAgY29uc29sZS5sb2cgZVxyXG4gIFxyXG5cclxud2luZG93LkdPVldJS0kuc2hvd19yZWNvcmQgPShyZWMpPT5cclxuICAkKCcjZGV0YWlscycpLmh0bWwgdGVtcGxhdGVzLmdldF9odG1sKDAsIHJlYylcclxuICBhY3RpdmF0ZV90YWIoKVxyXG4gIEdPVldJS0kuc2hvd19kYXRhX3BhZ2UoKVxyXG5cclxud2luZG93LkdPVldJS0kuc2hvd19yZWNvcmQyID0ocmVjKT0+XHJcbiAgZ2V0X2VsZWN0ZWRfb2ZmaWNpYWxzIHJlYy5faWQsIDI1LCAoZGF0YSwgdGV4dFN0YXR1cywganFYSFIpIC0+XHJcbiAgICByZWMuZWxlY3RlZF9vZmZpY2lhbHMgPSBkYXRhXHJcbiAgICAkKCcjZGV0YWlscycpLmh0bWwgdGVtcGxhdGVzLmdldF9odG1sKDAsIHJlYylcclxuICAgIGdldF9yZWNvcmQyIHJlYy5faWRcclxuICAgIGFjdGl2YXRlX3RhYigpXHJcbiAgICBHT1ZXSUtJLnNob3dfZGF0YV9wYWdlKClcclxuXHJcblxyXG4jIyNcclxud2luZG93LnNob3dfcmVjID0gKHJlYyktPlxyXG4gICQoJyNkZXRhaWxzJykuaHRtbCB0ZW1wbGF0ZXMuZ2V0X2h0bWwoMCwgcmVjKVxyXG4gIGFjdGl2YXRlX3RhYigpXHJcbiMjI1xyXG5cclxuYnVpbGRfc2VsZWN0b3IgPSAoY29udGFpbmVyLCB0ZXh0LCBjb21tYW5kLCB3aGVyZV90b19zdG9yZV92YWx1ZSApIC0+XHJcbiAgJC5hamF4XHJcbiAgICB1cmw6ICdodHRwczovL2FwaS5tb25nb2xhYi5jb20vYXBpLzEvZGF0YWJhc2VzL2dvdndpa2kvcnVuQ29tbWFuZD9hcGlLZXk9MFk1WF9RazJ1T0pSZEhKV0pLU1JXazZsNkpxVlRTMnknXHJcbiAgICB0eXBlOiAnUE9TVCdcclxuICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb25cIlxyXG4gICAgZGF0YVR5cGU6ICdqc29uJ1xyXG4gICAgZGF0YTogY29tbWFuZCAjSlNPTi5zdHJpbmdpZnkoY29tbWFuZClcclxuICAgIGNhY2hlOiB0cnVlXHJcbiAgICBzdWNjZXNzOiAoZGF0YSkgPT5cclxuICAgICAgI2E9JC5leHRlbmQgdHJ1ZSBbXSxkYXRhXHJcbiAgICAgIHZhbHVlcz1kYXRhLnZhbHVlc1xyXG4gICAgICBidWlsZF9zZWxlY3RfZWxlbWVudCBjb250YWluZXIsIHRleHQsIHZhbHVlcy5zb3J0KCksIHdoZXJlX3RvX3N0b3JlX3ZhbHVlXHJcbiAgICAgIHJldHVyblxyXG4gICAgZXJyb3I6KGUpIC0+XHJcbiAgICAgIGNvbnNvbGUubG9nIGVcclxuXHJcblxyXG5idWlsZF9zZWxlY3RfZWxlbWVudCA9IChjb250YWluZXIsIHRleHQsIGFyciwgd2hlcmVfdG9fc3RvcmVfdmFsdWUgKSAtPlxyXG4gIHMgID0gXCI8c2VsZWN0IGNsYXNzPSdmb3JtLWNvbnRyb2wnIHN0eWxlPSdtYXh3aWR0aDoxNjBweDsnPjxvcHRpb24gdmFsdWU9Jyc+I3t0ZXh0fTwvb3B0aW9uPlwiXHJcbiAgcyArPSBcIjxvcHRpb24gdmFsdWU9JyN7dn0nPiN7dn08L29wdGlvbj5cIiBmb3IgdiBpbiBhcnIgd2hlbiB2XHJcbiAgcyArPSBcIjwvc2VsZWN0PlwiXHJcbiAgc2VsZWN0ID0gJChzKVxyXG4gICQoY29udGFpbmVyKS5hcHBlbmQoc2VsZWN0KVxyXG4gIFxyXG4gICMgc2V0IGRlZmF1bHQgJ0NBJ1xyXG4gIGlmIHRleHQgaXMgJ1N0YXRlLi4nXHJcbiAgICBzZWxlY3QudmFsICdDQSdcclxuICAgIHdpbmRvdy5HT1ZXSUtJLnN0YXRlX2ZpbHRlcj0nQ0EnXHJcbiAgICBnb3ZtYXAub25fYm91bmRzX2NoYW5nZWRfbGF0ZXIoKVxyXG5cclxuICBzZWxlY3QuY2hhbmdlIChlKSAtPlxyXG4gICAgZWwgPSAkKGUudGFyZ2V0KVxyXG4gICAgd2luZG93LkdPVldJS0lbd2hlcmVfdG9fc3RvcmVfdmFsdWVdID0gZWwudmFsKClcclxuICAgICQoJy5nb3YtY291bnRlcicpLnRleHQgZ292X3NlbGVjdG9yLmNvdW50X2dvdnMoKVxyXG4gICAgZ292bWFwLm9uX2JvdW5kc19jaGFuZ2VkKClcclxuXHJcblxyXG5hZGp1c3RfdHlwZWFoZWFkX3dpZHRoID0oKSAtPlxyXG4gIGlucCA9ICQoJyNteWlucHV0JylcclxuICBwYXIgPSAkKCcjdHlwZWFoZWQtY29udGFpbmVyJylcclxuICBpbnAud2lkdGggcGFyLndpZHRoKClcclxuXHJcblxyXG5cclxuc3RhcnRfYWRqdXN0aW5nX3R5cGVhaGVhZF93aWR0aCA9KCkgLT5cclxuICAkKHdpbmRvdykucmVzaXplIC0+XHJcbiAgICBhZGp1c3RfdHlwZWFoZWFkX3dpZHRoKClcclxuXHJcblxyXG4jIGFkZCBsaXZlIHJlbG9hZCB0byB0aGUgc2l0ZS4gRm9yIGRldmVsb3BtZW50IG9ubHkuXHJcbmxpdmVyZWxvYWQgPSAocG9ydCkgLT5cclxuICB1cmw9d2luZG93LmxvY2F0aW9uLm9yaWdpbi5yZXBsYWNlIC86W146XSokLywgXCJcIlxyXG4gICQuZ2V0U2NyaXB0IHVybCArIFwiOlwiICsgcG9ydCwgPT5cclxuICAgICQoJ2JvZHknKS5hcHBlbmQgXCJcIlwiXHJcbiAgICA8ZGl2IHN0eWxlPSdwb3NpdGlvbjphYnNvbHV0ZTt6LWluZGV4OjEwMDA7XHJcbiAgICB3aWR0aDoxMDAlOyB0b3A6MDtjb2xvcjpyZWQ7IHRleHQtYWxpZ246IGNlbnRlcjsgXHJcbiAgICBwYWRkaW5nOjFweDtmb250LXNpemU6MTBweDtsaW5lLWhlaWdodDoxJz5saXZlPC9kaXY+XHJcbiAgICBcIlwiXCJcclxuXHJcbmZvY3VzX3NlYXJjaF9maWVsZCA9IChtc2VjKSAtPlxyXG4gIHNldFRpbWVvdXQgKC0+ICQoJyNteWlucHV0JykuZm9jdXMoKSkgLG1zZWNcclxuXHJcblxyXG4gIFxyXG5cclxuXHJcbiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG4jdGVtcGxhdGVzLmxvYWRfdGVtcGxhdGUgXCJ0YWJzXCIsIFwiY29uZmlnL3RhYmxheW91dC5qc29uXCJcclxudGVtcGxhdGVzLmxvYWRfZnVzaW9uX3RlbXBsYXRlIFwidGFic1wiLCBcImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL2Z1c2lvbnRhYmxlcy92Mi9xdWVyeT9zcWw9U0VMRUNUJTIwKiUyMEZST00lMjAxejJvWFFFWVEzcDJPb01JOFY1Z0tnSFdCNVR6OTkwQnJRMXhjMXRWbyZrZXk9QUl6YVN5Q1hEUXlNRHBHQTJnM1FqdXY0Q0R2N3pSai1peDRJUUpBXCJcclxuXHJcbmJ1aWxkX3NlbGVjdG9yKCcuc3RhdGUtY29udGFpbmVyJyAsICdTdGF0ZS4uJyAsICd7XCJkaXN0aW5jdFwiOiBcImdvdnNcIixcImtleVwiOlwic3RhdGVcIn0nICwgJ3N0YXRlX2ZpbHRlcicpXHJcbmJ1aWxkX3NlbGVjdG9yKCcuZ292LXR5cGUtY29udGFpbmVyJyAsICd0eXBlIG9mIGdvdmVybm1lbnQuLicgLCAne1wiZGlzdGluY3RcIjogXCJnb3ZzXCIsXCJrZXlcIjpcImdvdl90eXBlXCJ9JyAsICdnb3ZfdHlwZV9maWx0ZXInKVxyXG5cclxuYWRqdXN0X3R5cGVhaGVhZF93aWR0aCgpXHJcbnN0YXJ0X2FkanVzdGluZ190eXBlYWhlYWRfd2lkdGgoKVxyXG5cclxuJCgnI2J0bkJhY2tUb1NlYXJjaCcpLmNsaWNrIChlKS0+XHJcbiAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgR09WV0lLSS5zaG93X3NlYXJjaF9wYWdlKClcclxuXHJcbiNmb2N1c19zZWFyY2hfZmllbGQgNTAwXHJcblxyXG4gIFxyXG5cclxubGl2ZXJlbG9hZCBcIjkwOTBcIlxyXG5cclxuIiwiXHJcblxyXG5cclxuIyBUYWtlcyBhbiBhcnJheSBvZiBkb2NzIHRvIHNlYXJjaCBpbi5cclxuIyBSZXR1cm5zIGEgZnVuY3Rpb25zIHRoYXQgdGFrZXMgMiBwYXJhbXMgXHJcbiMgcSAtIHF1ZXJ5IHN0cmluZyBhbmQgXHJcbiMgY2IgLSBjYWxsYmFjayB0aGF0IHdpbGwgYmUgY2FsbGVkIHdoZW4gdGhlIHNlYXJjaCBpcyBkb25lLlxyXG4jIGNiIHJldHVybnMgYW4gYXJyYXkgb2YgbWF0Y2hpbmcgZG9jdW1lbnRzLlxyXG4jIG11bV9pdGVtcyAtIG1heCBudW1iZXIgb2YgZm91bmQgaXRlbXMgdG8gc2hvd1xyXG5RdWVyeU1hdGhlciA9IChkb2NzLCBudW1faXRlbXM9NSkgLT5cclxuICAocSwgY2IpIC0+XHJcbiAgICB0ZXN0X3N0cmluZyA9KHMsIHJlZ3MpIC0+XHJcbiAgICAgIChpZiBub3Qgci50ZXN0KHMpIHRoZW4gcmV0dXJuIGZhbHNlKSAgZm9yIHIgaW4gcmVnc1xyXG4gICAgICByZXR1cm4gdHJ1ZVxyXG5cclxuICAgIFt3b3JkcyxyZWdzXSA9IGdldF93b3Jkc19yZWdzIHFcclxuICAgIG1hdGNoZXMgPSBbXVxyXG4gICAgIyBpdGVyYXRlIHRocm91Z2ggdGhlIHBvb2wgb2YgZG9jcyBhbmQgZm9yIGFueSBzdHJpbmcgdGhhdFxyXG4gICAgIyBjb250YWlucyB0aGUgc3Vic3RyaW5nIGBxYCwgYWRkIGl0IHRvIHRoZSBgbWF0Y2hlc2AgYXJyYXlcclxuXHJcbiAgICBmb3IgZCBpbiBkb2NzXHJcbiAgICAgIGlmIG1hdGNoZXMubGVuZ3RoID49IG51bV9pdGVtcyB0aGVuIGJyZWFrXHJcbiAgICAgIGlmIEdPVldJS0kuc3RhdGVfZmlsdGVyIGFuZCBkLnN0YXRlIGlzbnQgR09WV0lLSS5zdGF0ZV9maWx0ZXIgdGhlbiBjb250aW51ZVxyXG4gICAgICBpZiBHT1ZXSUtJLmdvdl90eXBlX2ZpbHRlciBhbmQgZC5nb3ZfdHlwZSBpc250IEdPVldJS0kuZ292X3R5cGVfZmlsdGVyIHRoZW4gY29udGludWVcclxuXHJcbiAgICAgIGlmIHRlc3Rfc3RyaW5nKGQuZ292X25hbWUsIHJlZ3MpIHRoZW4gbWF0Y2hlcy5wdXNoICQuZXh0ZW5kKHt9LCBkKVxyXG4gICAgICAjaWYgdGVzdF9zdHJpbmcoXCIje2QuZ292X25hbWV9ICN7ZC5zdGF0ZX0gI3tkLmdvdl90eXBlfSAje2QuaW5jX2lkfVwiLCByZWdzKSB0aGVuIG1hdGNoZXMucHVzaCAkLmV4dGVuZCh7fSwgZClcclxuICAgIFxyXG4gICAgc2VsZWN0X3RleHQgbWF0Y2hlcywgd29yZHMsIHJlZ3NcclxuICAgIGNiIG1hdGNoZXNcclxuICAgIHJldHVyblxyXG4gXHJcblxyXG4jIGluc2VydHMgPHN0cm9uZz4gZWxlbWVudHNlIGluIGFycmF5XHJcbnNlbGVjdF90ZXh0ID0gKGNsb25lcyx3b3JkcyxyZWdzKSAtPlxyXG4gIGZvciBkIGluIGNsb25lc1xyXG4gICAgZC5nb3ZfbmFtZT1zdHJvbmdpZnkoZC5nb3ZfbmFtZSwgd29yZHMsIHJlZ3MpXHJcbiAgICAjZC5zdGF0ZT1zdHJvbmdpZnkoZC5zdGF0ZSwgd29yZHMsIHJlZ3MpXHJcbiAgICAjZC5nb3ZfdHlwZT1zdHJvbmdpZnkoZC5nb3ZfdHlwZSwgd29yZHMsIHJlZ3MpXHJcbiAgXHJcbiAgcmV0dXJuIGNsb25lc1xyXG5cclxuXHJcblxyXG4jIGluc2VydHMgPHN0cm9uZz4gZWxlbWVudHNlXHJcbnN0cm9uZ2lmeSA9IChzLCB3b3JkcywgcmVncykgLT5cclxuICByZWdzLmZvckVhY2ggKHIsaSkgLT5cclxuICAgIHMgPSBzLnJlcGxhY2UgciwgXCI8Yj4je3dvcmRzW2ldfTwvYj5cIlxyXG4gIHJldHVybiBzXHJcblxyXG4jIHJlbW92ZXMgPD4gdGFncyBmcm9tIGEgc3RyaW5nXHJcbnN0cmlwID0gKHMpIC0+XHJcbiAgcy5yZXBsYWNlKC88W148Pl0qPi9nLCcnKVxyXG5cclxuXHJcbiMgYWxsIHRpcm1zIHNwYWNlcyBmcm9tIGJvdGggc2lkZXMgYW5kIG1ha2UgY29udHJhY3RzIHNlcXVlbmNlcyBvZiBzcGFjZXMgdG8gMVxyXG5mdWxsX3RyaW0gPSAocykgLT5cclxuICBzcz1zLnRyaW0oJycrcylcclxuICBzcz1zcy5yZXBsYWNlKC8gKy9nLCcgJylcclxuXHJcbiMgcmV0dXJucyBhbiBhcnJheSBvZiB3b3JkcyBpbiBhIHN0cmluZ1xyXG5nZXRfd29yZHMgPSAoc3RyKSAtPlxyXG4gIGZ1bGxfdHJpbShzdHIpLnNwbGl0KCcgJylcclxuXHJcblxyXG5nZXRfd29yZHNfcmVncyA9IChzdHIpIC0+XHJcbiAgd29yZHMgPSBnZXRfd29yZHMgc3RyXHJcbiAgcmVncyA9IHdvcmRzLm1hcCAodyktPiBuZXcgUmVnRXhwKFwiI3t3fVwiLCdpZycpXHJcbiAgW3dvcmRzLHJlZ3NdXHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBRdWVyeU1hdGhlclxyXG5cclxuIiwiXHJcbiMjI1xyXG4jIGZpbGU6IHRlbXBsYXRlczIuY29mZmVlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuI1xyXG4jIENsYXNzIHRvIG1hbmFnZSB0ZW1wbGF0ZXMgYW5kIHJlbmRlciBkYXRhIG9uIGh0bWwgcGFnZS5cclxuI1xyXG4jIFRoZSBtYWluIG1ldGhvZCA6IHJlbmRlcihkYXRhKSwgZ2V0X2h0bWwoZGF0YSlcclxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuIyMjXHJcblxyXG5cclxuXHJcbiMgTE9BRCBGSUVMRCBOQU1FUyBcclxuZmllbGROYW1lcyA9IHt9XHJcblxyXG5cclxucmVuZGVyX2ZpZWxkX3ZhbHVlID0obixtYXNrLGRhdGEpIC0+XHJcbiAgdj1kYXRhW25dXHJcbiAgaWYgbm90IGRhdGFbbl1cclxuICAgIHJldHVybiAnJ1xyXG5cclxuICBpZiBuID09IFwid2ViX3NpdGVcIlxyXG4gICAgcmV0dXJuIFwiPGEgdGFyZ2V0PSdfYmxhbmsnIGhyZWY9JyN7dn0nPiN7dn08L2E+XCJcclxuICBlbHNlXHJcbiAgICBpZiAnJyAhPSBtYXNrXHJcbiAgICAgIHJldHVybiBudW1lcmFsKHYpLmZvcm1hdChtYXNrKVxyXG4gICAgZWxzZVxyXG4gICAgICByZXR1cm4gdlxyXG4gIFxyXG5cclxucmVuZGVyX2ZpZWxkX25hbWUgPSAoZk5hbWUpIC0+XHJcbiAgaWYgZmllbGROYW1lc1tmTmFtZV0/XHJcbiAgICByZXR1cm4gZmllbGROYW1lc1tmTmFtZV1cclxuXHJcbiAgcyA9IGZOYW1lLnJlcGxhY2UoL18vZyxcIiBcIilcclxuICBzID0gcy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHMuc3Vic3RyaW5nKDEpXHJcbiAgcmV0dXJuIHNcclxuXHJcblxyXG5yZW5kZXJfZmllbGQgPSAoZk5hbWUsZGF0YSktPlxyXG4gIGlmIFwiX1wiID09IHN1YnN0ciBmTmFtZSwgMCwgMVxyXG4gICAgXCJcIlwiXHJcbiAgICA8ZGl2PlxyXG4gICAgICAgIDxzcGFuIGNsYXNzPSdmLW5hbSc+I3tyZW5kZXJfZmllbGRfbmFtZSBmTmFtZX08L3NwYW4+XHJcbiAgICAgICAgPHNwYW4gY2xhc3M9J2YtdmFsJz4mbmJzcDs8L3NwYW4+XHJcbiAgICA8L2Rpdj5cclxuICAgIFwiXCJcIlxyXG4gIGVsc2VcclxuICAgIHJldHVybiAnJyB1bmxlc3MgZlZhbHVlID0gZGF0YVtmTmFtZV1cclxuICAgIFwiXCJcIlxyXG4gICAgPGRpdj5cclxuICAgICAgICA8c3BhbiBjbGFzcz0nZi1uYW0nPiN7cmVuZGVyX2ZpZWxkX25hbWUgZk5hbWV9PC9zcGFuPlxyXG4gICAgICAgIDxzcGFuIGNsYXNzPSdmLXZhbCc+I3tyZW5kZXJfZmllbGRfdmFsdWUoZk5hbWUsZGF0YSl9PC9zcGFuPlxyXG4gICAgPC9kaXY+XHJcbiAgICBcIlwiXCJcclxuXHJcbiAgXHJcbnJlbmRlcl9maWVsZHMgPSAoZmllbGRzLGRhdGEsdGVtcGxhdGUpLT5cclxuICBoID0gJydcclxuICBmb3IgZmllbGQsaSBpbiBmaWVsZHNcclxuICAgIGlmICh0eXBlb2YgZmllbGQgaXMgXCJvYmplY3RcIilcclxuICAgICAgZlZhbHVlID0gcmVuZGVyX2ZpZWxkX3ZhbHVlIGZpZWxkLm5hbWUsIGZpZWxkLm1hc2ssIGRhdGFcclxuICAgICAgaWYgKCcnICE9IGZWYWx1ZSlcclxuICAgICAgICBmTmFtZSA9IHJlbmRlcl9maWVsZF9uYW1lIGZpZWxkLm5hbWVcclxuICAgIGVsc2VcclxuICAgICAgZlZhbHVlID0gcmVuZGVyX2ZpZWxkX3ZhbHVlIGZpZWxkLCAnJywgZGF0YVxyXG4gICAgICBpZiAoJycgIT0gZlZhbHVlKVxyXG4gICAgICAgIGZOYW1lID0gcmVuZGVyX2ZpZWxkX25hbWUgZmllbGRcclxuICAgIGlmICgnJyAhPSBmVmFsdWUpXHJcbiAgICAgIGggKz0gdGVtcGxhdGUobmFtZTogZk5hbWUsIHZhbHVlOiBmVmFsdWUpXHJcbiAgcmV0dXJuIGhcclxuXHJcbnJlbmRlcl9maW5hbmNpYWxfZmllbGRzID0gKGRhdGEsdGVtcGxhdGUpLT5cclxuICBoID0gJydcclxuICBtYXNrID0gJyQwLDAuMDAnXHJcbiAgY2F0ZWdvcnkgPSAnJ1xyXG4gIGZvciBmaWVsZCBpbiBkYXRhXHJcbiAgICBpZiBjYXRlZ29yeSAhPSBmaWVsZC5jYXRlZ29yeV9uYW1lXHJcbiAgICAgIGNhdGVnb3J5ID0gZmllbGQuY2F0ZWdvcnlfbmFtZVxyXG4gICAgICBoICs9IHRlbXBsYXRlKG5hbWU6IFwiPGI+XCIgKyBjYXRlZ29yeSArIFwiPC9iPlwiLCBnZW5mdW5kOiAnJywgb3RoZXJmdW5kczogJycsIHRvdGFsZnVuZHM6ICcnKVxyXG4gICAgaCArPSB0ZW1wbGF0ZShuYW1lOiBcIjxpPlwiICsgZmllbGQuY2FwdGlvbiArIFwiPC9pPlwiLCBnZW5mdW5kOiBudW1lcmFsKGZpZWxkLmdlbmZ1bmQpLmZvcm1hdChtYXNrKSwgb3RoZXJmdW5kczogbnVtZXJhbChmaWVsZC5vdGhlcmZ1bmRzKS5mb3JtYXQobWFzayksIHRvdGFsZnVuZHM6IG51bWVyYWwoZmllbGQudG90YWxmdW5kcykuZm9ybWF0KG1hc2spKVxyXG4gIHJldHVybiBoXHJcblxyXG51bmRlciA9IChzKSAtPiBzLnJlcGxhY2UoL1tcXHNcXCtcXC1dL2csICdfJylcclxuXHJcblxyXG5yZW5kZXJfdGFicyA9IChpbml0aWFsX2xheW91dCwgZGF0YSwgdGFic2V0LCBwYXJlbnQpIC0+XHJcbiAgI2xheW91dCA9IGFkZF9vdGhlcl90YWJfdG9fbGF5b3V0IGluaXRpYWxfbGF5b3V0LCBkYXRhXHJcbiAgbGF5b3V0ID0gaW5pdGlhbF9sYXlvdXRcclxuICB0ZW1wbGF0ZXMgPSBwYXJlbnQudGVtcGxhdGVzXHJcbiAgcGxvdF9oYW5kbGVzID0ge31cclxuXHJcbiAgbGF5b3V0X2RhdGEgPVxyXG4gICAgdGl0bGU6IGRhdGEuZ292X25hbWUsXHJcbiAgICB0YWJzOiBbXSxcclxuICAgIHRhYmNvbnRlbnQ6ICcnXHJcbiAgXHJcbiAgZm9yIHRhYixpIGluIGxheW91dFxyXG4gICAgbGF5b3V0X2RhdGEudGFicy5wdXNoXHJcbiAgICAgIHRhYmlkOiB1bmRlcih0YWIubmFtZSksXHJcbiAgICAgIHRhYm5hbWU6IHRhYi5uYW1lLFxyXG4gICAgICBhY3RpdmU6IChpZiBpPjAgdGhlbiAnJyBlbHNlICdhY3RpdmUnKVxyXG5cclxuICBmb3IgdGFiLGkgaW4gbGF5b3V0XHJcbiAgICBkZXRhaWxfZGF0YSA9XHJcbiAgICAgIHRhYmlkOiB1bmRlcih0YWIubmFtZSksXHJcbiAgICAgIHRhYm5hbWU6IHRhYi5uYW1lLFxyXG4gICAgICBhY3RpdmU6IChpZiBpPjAgdGhlbiAnJyBlbHNlICdhY3RpdmUnKVxyXG4gICAgICB0YWJjb250ZW50OiAnJ1xyXG4gICAgc3dpdGNoIHRhYi5uYW1lXHJcbiAgICAgIHdoZW4gJ092ZXJ2aWV3ICsgRWxlY3RlZCBPZmZpY2lhbHMnXHJcbiAgICAgICAgZGV0YWlsX2RhdGEudGFiY29udGVudCArPSByZW5kZXJfZmllbGRzIHRhYi5maWVsZHMsIGRhdGEsIHRlbXBsYXRlc1sndGFiZGV0YWlsLW5hbWV2YWx1ZS10ZW1wbGF0ZSddXHJcbiAgICAgICAgZm9yIG9mZmljaWFsLGkgaW4gZGF0YS5lbGVjdGVkX29mZmljaWFscy5yZWNvcmRcclxuICAgICAgICAgIG9mZmljaWFsX2RhdGEgPVxyXG4gICAgICAgICAgICB0aXRsZTogaWYgJycgIT0gb2ZmaWNpYWwudGl0bGUgdGhlbiBcIlRpdGxlOiBcIiArIG9mZmljaWFsLnRpdGxlIGVsc2UgJydcclxuICAgICAgICAgICAgbmFtZTogaWYgJycgIT0gb2ZmaWNpYWwuZnVsbF9uYW1lIHRoZW4gXCJOYW1lOiBcIiArIG9mZmljaWFsLmZ1bGxfbmFtZSBlbHNlICcnXHJcbiAgICAgICAgICAgIGVtYWlsOiBpZiAnJyAhPSBvZmZpY2lhbC5lbWFpbF9hZGRyZXNzIHRoZW4gXCJFbWFpbDogXCIgKyBvZmZpY2lhbC5lbWFpbF9hZGRyZXNzIGVsc2UgJydcclxuICAgICAgICAgICAgdGVybWV4cGlyZXM6IGlmICcnICE9IG9mZmljaWFsLnRlcm1fZXhwaXJlcyB0aGVuIFwiVGVybSBFeHBpcmVzOiBcIiArIG9mZmljaWFsLnRlcm1fZXhwaXJlcyBlbHNlICcnXHJcbiAgICAgICAgICBvZmZpY2lhbF9kYXRhLmltYWdlID0gJzxpbWcgc3JjPVwiJytvZmZpY2lhbC5waG90b191cmwrJ1wiIGFsdD1cIlwiIC8+JyBpZiAnJyAhPSBvZmZpY2lhbC5waG90b191cmxcclxuICAgICAgICAgIGRldGFpbF9kYXRhLnRhYmNvbnRlbnQgKz0gdGVtcGxhdGVzWyd0YWJkZXRhaWwtb2ZmaWNpYWwtdGVtcGxhdGUnXShvZmZpY2lhbF9kYXRhKVxyXG4gICAgICB3aGVuICdFbXBsb3llZSBDb21wZW5zYXRpb24nXHJcbiAgICAgICAgaCA9ICcnXHJcbiAgICAgICAgaCArPSByZW5kZXJfZmllbGRzIHRhYi5maWVsZHMsIGRhdGEsIHRlbXBsYXRlc1sndGFiZGV0YWlsLW5hbWV2YWx1ZS10ZW1wbGF0ZSddXHJcbiAgICAgICAgZGV0YWlsX2RhdGEudGFiY29udGVudCArPSB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC1lbXBsb3llZS1jb21wLXRlbXBsYXRlJ10oY29udGVudDogaClcclxuICAgICAgICB0YWJzZXQuYmluZCB0YWIubmFtZSwgKHRwbF9uYW1lLCBkYXRhKSAtPlxyXG4gICAgICAgICAgb3B0aW9ucyA9XHJcbiAgICAgICAgICAgIHhheGlzOlxyXG4gICAgICAgICAgICAgIG1pblRpY2tTaXplOiAxXHJcbiAgICAgICAgICAgICAgbGFiZWxXaWR0aDogMTAwXHJcbiAgICAgICAgICAgIHlheGlzOlxyXG4gICAgICAgICAgICAgIHRpY2tGb3JtYXR0ZXI6ICh2YWwsIGF4aXMpIC0+XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJydcclxuICAgICAgICAgICAgc2VyaWVzOlxyXG4gICAgICAgICAgICAgIGJhcnM6XHJcbiAgICAgICAgICAgICAgICBzaG93OiB0cnVlXHJcbiAgICAgICAgICAgICAgICBiYXJXaWR0aDogLjRcclxuICAgICAgICAgICAgICAgIGFsaWduOiBcImNlbnRlclwiXHJcbiAgICAgICAgICBpZiBub3QgcGxvdF9oYW5kbGVzWydtZWRpYW4tY29tcC1ncmFwaCddXHJcbiAgICAgICAgICAgIG9wdGlvbnMueGF4aXMudGlja3MgPSBbWzEsIFwiTWVkaWFuIFRvdGFsIEdvdi4gQ29tcFwiXSwgWzIsIFwiTWVkaWFuIFRvdGFsIEluZGl2aWR1YWwgQ29tcFwiXV1cclxuICAgICAgICAgICAgcGxvdF9zcGVjID0gW11cclxuICAgICAgICAgICAgcGxvdF9kYXRhX2JvdHRvbSA9IFtbMSwgZGF0YVsnbWVkaWFuX3RvdGFsX2NvbXBfcGVyX2Z0X2VtcCddIC8gZGF0YVsnbWVkaWFuX3RvdGFsX2NvbXBfb3Zlcl9tZWRpYW5faW5kaXZpZHVhbF9jb21wJ11dLCBbMiwgZGF0YVsnbWVkaWFuX3RvdGFsX2NvbXBfcGVyX2Z0X2VtcCddXV1cclxuICAgICAgICAgICAgcGxvdF9kYXRhX3RvcCA9IFtbXSwgW11dXHJcbiAgICAgICAgICAgIHBsb3Rfc3BlYy5wdXNoXHJcbiAgICAgICAgICAgICAgZGF0YTogcGxvdF9kYXRhX2JvdHRvbVxyXG4gICAgICAgICAgICAjIyNcclxuICAgICAgICAgICAgcGxvdF9zcGVjLnB1c2hcclxuICAgICAgICAgICAgICBkYXRhOiBwbG90X2RhdGFfdG9wXHJcbiAgICAgICAgICAgICMjI1xyXG4gICAgICAgICAgICBwbG90X2hhbmRsZXNbJ21lZGlhbi1jb21wLWdyYXBoJ10gPSAkKFwiI21lZGlhbi1jb21wLWdyYXBoXCIpLnBsb3QocGxvdF9zcGVjLCBvcHRpb25zKVxyXG4gICAgICAgICAgaWYgbm90IHBsb3RfaGFuZGxlc1snbWVkaWFuLXBlbnNpb24tZ3JhcGgnXVxyXG4gICAgICAgICAgICBvcHRpb25zLnhheGlzLnRpY2tzID0gW1sxLCBcIk1lZGlhbiBQZW5zaW9uIGZvciBSZXRpcmVlIHcvIDMwIFllYXJzXCJdLCBbMiwgXCJNZWRpYW4gVG90YWwgSW5kaXZpZHVhbCBDb21wXCJdXVxyXG4gICAgICAgICAgICBwbG90X3NwZWMgPSBbXVxyXG4gICAgICAgICAgICBwbG90X2RhdGFfYm90dG9tID0gW1sxLCBkYXRhWydtZWRpYW5fcGVuc2lvbl8zMF95ZWFyX3JldGlyZWUnXV0sIFsyLCBkYXRhWydtZWRpYW5fZWFybmluZ3MnXV1dXHJcbiAgICAgICAgICAgIHBsb3RfZGF0YV90b3AgPSBbW10sIFtdXVxyXG4gICAgICAgICAgICBwbG90X3NwZWMucHVzaFxyXG4gICAgICAgICAgICAgIGRhdGE6IHBsb3RfZGF0YV9ib3R0b21cclxuICAgICAgICAgICAgIyMjXHJcbiAgICAgICAgICAgIHBsb3Rfc3BlYy5wdXNoXHJcbiAgICAgICAgICAgICAgZGF0YTogcGxvdF9kYXRhX3RvcFxyXG4gICAgICAgICAgICAjIyNcclxuICAgICAgICAgICAgcGxvdF9oYW5kbGVzWydtZWRpYW4tcGVuc2lvbi1ncmFwaCddID0gJChcIiNtZWRpYW4tcGVuc2lvbi1ncmFwaFwiKS5wbG90KHBsb3Rfc3BlYywgb3B0aW9ucylcclxuICAgICAgICAgICNpZiBub3QgcGxvdF9oYW5kbGVzWydwY3QtcGVuc2lvbi1ncmFwaCddXHJcbiAgICAgICAgICBpZiBmYWxzZVxyXG4gICAgICAgICAgICBwbG90X3NwZWMgPSBbXVxyXG4gICAgICAgICAgICBwbG90X2RhdGFfYm90dG9tID0gW1tdLCBbXV1cclxuICAgICAgICAgICAgcGxvdF9kYXRhX3RvcCA9IFtbXSwgW11dXHJcbiAgICAgICAgICAgIHBsb3Rfc3BlYy5wdXNoXHJcbiAgICAgICAgICAgICAgZGF0YTogcGxvdF9kYXRhX2JvdHRvbVxyXG4gICAgICAgICAgICAgIGxhYmVsOiBcIlBlbnNpb24gJiBPUEVCIChyZXEnZCkgYXMgJSBvZiB0b3RhbCByZXZlbnVlXCJcclxuICAgICAgICAgICAgIyMjXHJcbiAgICAgICAgICAgIHBsb3Rfc3BlYy5wdXNoXHJcbiAgICAgICAgICAgICAgZGF0YTogcGxvdF9kYXRhX3RvcFxyXG4gICAgICAgICAgICAgIGxhYmVsOiBcIk1lZGlhbiBUb3RhbCBJbmRpdmlkdWFsIENvbXBcIlxyXG4gICAgICAgICAgICAjIyNcclxuICAgICAgICAgICAgcGxvdF9oYW5kbGVzWydwY3QtcGVuc2lvbi1ncmFwaCddID0gJChcIiNwY3QtcGVuc2lvbi1ncmFwaFwiKS5wbG90KHBsb3Rfc3BlYywgb3B0aW9ucylcclxuICAgICAgd2hlbiAnRmluYW5jaWFsIEhlYWx0aCdcclxuICAgICAgICBoID0gJydcclxuICAgICAgICBoICs9IHJlbmRlcl9maWVsZHMgdGFiLmZpZWxkcywgZGF0YSwgdGVtcGxhdGVzWyd0YWJkZXRhaWwtbmFtZXZhbHVlLXRlbXBsYXRlJ11cclxuICAgICAgICBkZXRhaWxfZGF0YS50YWJjb250ZW50ICs9IHRlbXBsYXRlc1sndGFiZGV0YWlsLWZpbmFuY2lhbC1oZWFsdGgtdGVtcGxhdGUnXShjb250ZW50OiBoKVxyXG4gICAgICAgIHRhYnNldC5iaW5kIHRhYi5uYW1lLCAodHBsX25hbWUsIGRhdGEpIC0+XHJcbiAgICAgICAgICBvcHRpb25zID1cclxuICAgICAgICAgICAgc2VyaWVzOlxyXG4gICAgICAgICAgICAgIHBpZTpcclxuICAgICAgICAgICAgICAgIHNob3c6IHRydWVcclxuICAgICAgICAgIGlmIG5vdCBwbG90X2hhbmRsZXNbJ3B1YmxpYy1zYWZldHktcGllJ11cclxuICAgICAgICAgICAgcGxvdF9zcGVjID0gW3tsYWJlbDogJ1B1YmxpYyBzYWZldHkgZXhwZW5zZScsIGRhdGE6IGRhdGFbJ3B1YmxpY19zYWZldHlfZXhwX292ZXJfdG90X2dvdl9mdW5kX3JldmVudWUnXX0sIHtsYWJlbDogJ090aGVyIGdvdi4gZnVuZCByZXZlbnVlJywgZGF0YTogMTAwIC0gZGF0YVsncHVibGljX3NhZmV0eV9leHBfb3Zlcl90b3RfZ292X2Z1bmRfcmV2ZW51ZSddfV1cclxuICAgICAgICAgICAgcGxvdF9oYW5kbGVzWydwdWJsaWMtc2FmZXR5LXBpZSddID0gJChcIiNwdWJsaWMtc2FmZXR5LXBpZVwiKS5wbG90KHBsb3Rfc3BlYywgb3B0aW9ucylcclxuICAgICAgd2hlbiAnRmluYW5jaWFsIFN0YXRlbWVudHMnXHJcbiAgICAgICAgaWYgZGF0YS5maW5hbmNpYWxfc3RhdGVtZW50c1xyXG4gICAgICAgICAgaCA9ICcnXHJcbiAgICAgICAgICAjaCArPSByZW5kZXJfZmllbGRzIHRhYi5maWVsZHMsIGRhdGEsIHRlbXBsYXRlc1sndGFiZGV0YWlsLW5hbWV2YWx1ZS10ZW1wbGF0ZSddXHJcbiAgICAgICAgICBoICs9IHJlbmRlcl9maW5hbmNpYWxfZmllbGRzIGRhdGEuZmluYW5jaWFsX3N0YXRlbWVudHMsIHRlbXBsYXRlc1sndGFiZGV0YWlsLWZpbnN0YXRlbWVudC10ZW1wbGF0ZSddXHJcbiAgICAgICAgICBkZXRhaWxfZGF0YS50YWJjb250ZW50ICs9IHRlbXBsYXRlc1sndGFiZGV0YWlsLWZpbmFuY2lhbC1zdGF0ZW1lbnRzLXRlbXBsYXRlJ10oY29udGVudDogaClcclxuICAgICAgICAgICN0YWJkZXRhaWwtZmluYW5jaWFsLXN0YXRlbWVudHMtdGVtcGxhdGVcclxuICAgICAgZWxzZVxyXG4gICAgICAgIGRldGFpbF9kYXRhLnRhYmNvbnRlbnQgKz0gcmVuZGVyX2ZpZWxkcyB0YWIuZmllbGRzLCBkYXRhLCB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC1uYW1ldmFsdWUtdGVtcGxhdGUnXVxyXG4gICAgXHJcbiAgICBsYXlvdXRfZGF0YS50YWJjb250ZW50ICs9IHRlbXBsYXRlc1sndGFiZGV0YWlsLXRlbXBsYXRlJ10oZGV0YWlsX2RhdGEpXHJcbiAgcmV0dXJuIHRlbXBsYXRlc1sndGFicGFuZWwtdGVtcGxhdGUnXShsYXlvdXRfZGF0YSlcclxuXHJcblxyXG5nZXRfbGF5b3V0X2ZpZWxkcyA9IChsYSkgLT5cclxuICBmID0ge31cclxuICBmb3IgdCBpbiBsYVxyXG4gICAgZm9yIGZpZWxkIGluIHQuZmllbGRzXHJcbiAgICAgIGZbZmllbGRdID0gMVxyXG4gIHJldHVybiBmXHJcblxyXG5nZXRfcmVjb3JkX2ZpZWxkcyA9IChyKSAtPlxyXG4gIGYgPSB7fVxyXG4gIGZvciBmaWVsZF9uYW1lIG9mIHJcclxuICAgIGZbZmllbGRfbmFtZV0gPSAxXHJcbiAgcmV0dXJuIGZcclxuXHJcbmdldF91bm1lbnRpb25lZF9maWVsZHMgPSAobGEsIHIpIC0+XHJcbiAgbGF5b3V0X2ZpZWxkcyA9IGdldF9sYXlvdXRfZmllbGRzIGxhXHJcbiAgcmVjb3JkX2ZpZWxkcyA9IGdldF9yZWNvcmRfZmllbGRzIHJcclxuICB1bm1lbnRpb25lZF9maWVsZHMgPSBbXVxyXG4gIHVubWVudGlvbmVkX2ZpZWxkcy5wdXNoKGYpIGZvciBmIG9mIHJlY29yZF9maWVsZHMgd2hlbiBub3QgbGF5b3V0X2ZpZWxkc1tmXVxyXG4gIHJldHVybiB1bm1lbnRpb25lZF9maWVsZHNcclxuXHJcblxyXG5hZGRfb3RoZXJfdGFiX3RvX2xheW91dCA9IChsYXlvdXQ9W10sIGRhdGEpIC0+XHJcbiAgI2Nsb25lIHRoZSBsYXlvdXRcclxuICBsID0gJC5leHRlbmQgdHJ1ZSwgW10sIGxheW91dFxyXG4gIHQgPVxyXG4gICAgbmFtZTogXCJPdGhlclwiXHJcbiAgICBmaWVsZHM6IGdldF91bm1lbnRpb25lZF9maWVsZHMgbCwgZGF0YVxyXG5cclxuICBsLnB1c2ggdFxyXG4gIHJldHVybiBsXHJcblxyXG5cclxuIyBjb252ZXJ0cyB0YWIgdGVtcGxhdGUgZGVzY3JpYmVkIGluIGdvb2dsZSBmdXNpb24gdGFibGUgdG8gXHJcbiMgdGFiIHRlbXBsYXRlXHJcbmNvbnZlcnRfZnVzaW9uX3RlbXBsYXRlPSh0ZW1wbCkgLT5cclxuICB0YWJfaGFzaD17fVxyXG4gIHRhYnM9W11cclxuICAjIHJldHVybnMgaGFzaCBvZiBmaWVsZCBuYW1lcyBhbmQgdGhlaXIgcG9zaXRpb25zIGluIGFycmF5IG9mIGZpZWxkIG5hbWVzXHJcbiAgZ2V0X2NvbF9oYXNoID0gKGNvbHVtbnMpIC0+XHJcbiAgICBjb2xfaGFzaCA9e31cclxuICAgIGNvbF9oYXNoW2NvbF9uYW1lXT1pIGZvciBjb2xfbmFtZSxpIGluIHRlbXBsLmNvbHVtbnNcclxuICAgIHJldHVybiBjb2xfaGFzaFxyXG4gIFxyXG4gICMgcmV0dXJucyBmaWVsZCB2YWx1ZSBieSBpdHMgbmFtZSwgYXJyYXkgb2YgZmllbGRzLCBhbmQgaGFzaCBvZiBmaWVsZHNcclxuICB2YWwgPSAoZmllbGRfbmFtZSwgZmllbGRzLCBjb2xfaGFzaCkgLT5cclxuICAgIGZpZWxkc1tjb2xfaGFzaFtmaWVsZF9uYW1lXV1cclxuICBcclxuICAjIGNvbnZlcnRzIGhhc2ggdG8gYW4gYXJyYXkgdGVtcGxhdGVcclxuICBoYXNoX3RvX2FycmF5ID0oaGFzaCkgLT5cclxuICAgIGEgPSBbXVxyXG4gICAgZm9yIGsgb2YgaGFzaFxyXG4gICAgICB0YWIgPSB7fVxyXG4gICAgICB0YWIubmFtZT1rXHJcbiAgICAgIHRhYi5maWVsZHM9aGFzaFtrXVxyXG4gICAgICBhLnB1c2ggdGFiXHJcbiAgICByZXR1cm4gYVxyXG5cclxuICAgIFxyXG4gIGNvbF9oYXNoID0gZ2V0X2NvbF9oYXNoKHRlbXBsLmNvbF9oYXNoKVxyXG4gIHBsYWNlaG9sZGVyX2NvdW50ID0gMFxyXG4gIFxyXG4gIGZvciByb3csaSBpbiB0ZW1wbC5yb3dzXHJcbiAgICBjYXRlZ29yeSA9IHZhbCAnZ2VuZXJhbF9jYXRlZ29yeScsIHJvdywgY29sX2hhc2hcclxuICAgICN0YWJfaGFzaFtjYXRlZ29yeV09W10gdW5sZXNzIHRhYl9oYXNoW2NhdGVnb3J5XVxyXG4gICAgZmllbGRuYW1lID0gdmFsICdmaWVsZF9uYW1lJywgcm93LCBjb2xfaGFzaFxyXG4gICAgaWYgbm90IGZpZWxkbmFtZSB0aGVuIGZpZWxkbmFtZSA9IFwiX1wiICsgU3RyaW5nICsrcGxhY2Vob2xkZXJfY291bnRcclxuICAgIGZpZWxkTmFtZXNbdmFsICdmaWVsZF9uYW1lJywgcm93LCBjb2xfaGFzaF09dmFsICdkZXNjcmlwdGlvbicsIHJvdywgY29sX2hhc2hcclxuICAgIGlmIGNhdGVnb3J5XHJcbiAgICAgIHRhYl9oYXNoW2NhdGVnb3J5XT89W11cclxuICAgICAgdGFiX2hhc2hbY2F0ZWdvcnldLnB1c2ggbjogdmFsKCduJywgcm93LCBjb2xfaGFzaCksIG5hbWU6IGZpZWxkbmFtZSwgZm10OiB2YWwoJ21hc2snLCByb3csIGNvbF9oYXNoKVxyXG5cclxuICBjYXRlZ29yaWVzID0gT2JqZWN0LmtleXModGFiX2hhc2gpXHJcbiAgZm9yIGNhdGVnb3J5IGluIGNhdGVnb3JpZXNcclxuICAgIGZpZWxkcyA9IFtdXHJcbiAgICBmb3Igb2JqIGluIHRhYl9oYXNoW2NhdGVnb3J5XVxyXG4gICAgICBmaWVsZHMucHVzaCBvYmpcclxuICAgIGZpZWxkcy5zb3J0IChhLGIpIC0+XHJcbiAgICAgIHJldHVybiBhLm4gLSBiLm5cclxuICAgIHRhYl9oYXNoW2NhdGVnb3J5XSA9IGZpZWxkc1xyXG5cclxuICB0YWJzID0gaGFzaF90b19hcnJheSh0YWJfaGFzaClcclxuICByZXR1cm4gdGFic1xyXG5cclxuXHJcbmNsYXNzIFRlbXBsYXRlczJcclxuXHJcbiAgQGxpc3QgPSB1bmRlZmluZWRcclxuICBAdGVtcGxhdGVzID0gdW5kZWZpbmVkXHJcbiAgQGRhdGEgPSB1bmRlZmluZWRcclxuICBAZXZlbnRzID0gdW5kZWZpbmVkXHJcblxyXG4gIGNvbnN0cnVjdG9yOigpIC0+XHJcbiAgICBAbGlzdCA9IFtdXHJcbiAgICBAZXZlbnRzID0ge31cclxuICAgIHRlbXBsYXRlTGlzdCA9IFsndGFicGFuZWwtdGVtcGxhdGUnLCAndGFiZGV0YWlsLXRlbXBsYXRlJywgJ3RhYmRldGFpbC1uYW1ldmFsdWUtdGVtcGxhdGUnLCAndGFiZGV0YWlsLWZpbnN0YXRlbWVudC10ZW1wbGF0ZScsICd0YWJkZXRhaWwtb2ZmaWNpYWwtdGVtcGxhdGUnLCAndGFiZGV0YWlsLWVtcGxveWVlLWNvbXAtdGVtcGxhdGUnLCAndGFiZGV0YWlsLWZpbmFuY2lhbC1oZWFsdGgtdGVtcGxhdGUnLCAndGFiZGV0YWlsLWZpbmFuY2lhbC1zdGF0ZW1lbnRzLXRlbXBsYXRlJ11cclxuICAgIHRlbXBsYXRlUGFydGlhbHMgPSBbJ3RhYi10ZW1wbGF0ZSddXHJcbiAgICBAdGVtcGxhdGVzID0ge31cclxuICAgIGZvciB0ZW1wbGF0ZSxpIGluIHRlbXBsYXRlTGlzdFxyXG4gICAgICBAdGVtcGxhdGVzW3RlbXBsYXRlXSA9IEhhbmRsZWJhcnMuY29tcGlsZSgkKCcjJyArIHRlbXBsYXRlKS5odG1sKCkpXHJcbiAgICBmb3IgdGVtcGxhdGUsaSBpbiB0ZW1wbGF0ZVBhcnRpYWxzXHJcbiAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJQYXJ0aWFsKHRlbXBsYXRlLCAkKCcjJyArIHRlbXBsYXRlKS5odG1sKCkpXHJcblxyXG4gIGFkZF90ZW1wbGF0ZTogKGxheW91dF9uYW1lLCBsYXlvdXRfanNvbikgLT5cclxuICAgIEBsaXN0LnB1c2hcclxuICAgICAgcGFyZW50OnRoaXNcclxuICAgICAgbmFtZTpsYXlvdXRfbmFtZVxyXG4gICAgICByZW5kZXI6KGRhdCkgLT5cclxuICAgICAgICBAcGFyZW50LmRhdGEgPSBkYXRcclxuICAgICAgICByZW5kZXJfdGFicyhsYXlvdXRfanNvbiwgZGF0LCB0aGlzLCBAcGFyZW50KVxyXG4gICAgICBiaW5kOiAodHBsX25hbWUsIGNhbGxiYWNrKSAtPlxyXG4gICAgICAgIGlmIG5vdCBAcGFyZW50LmV2ZW50c1t0cGxfbmFtZV1cclxuICAgICAgICAgIEBwYXJlbnQuZXZlbnRzW3RwbF9uYW1lXSA9IFtjYWxsYmFja11cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICBAcGFyZW50LmV2ZW50c1t0cGxfbmFtZV0ucHVzaCBjYWxsYmFja1xyXG4gICAgICBhY3RpdmF0ZTogKHRwbF9uYW1lKSAtPlxyXG4gICAgICAgIGlmIEBwYXJlbnQuZXZlbnRzW3RwbF9uYW1lXVxyXG4gICAgICAgICAgZm9yIGUsaSBpbiBAcGFyZW50LmV2ZW50c1t0cGxfbmFtZV1cclxuICAgICAgICAgICAgZSB0cGxfbmFtZSwgQHBhcmVudC5kYXRhXHJcblxyXG4gIGxvYWRfdGVtcGxhdGU6KHRlbXBsYXRlX25hbWUsIHVybCkgLT5cclxuICAgICQuYWpheFxyXG4gICAgICB1cmw6IHVybFxyXG4gICAgICBkYXRhVHlwZTogJ2pzb24nXHJcbiAgICAgIGNhY2hlOiB0cnVlXHJcbiAgICAgIHN1Y2Nlc3M6ICh0ZW1wbGF0ZV9qc29uKSA9PlxyXG4gICAgICAgIEBhZGRfdGVtcGxhdGUodGVtcGxhdGVfbmFtZSwgdGVtcGxhdGVfanNvbilcclxuICAgICAgICByZXR1cm5cclxuXHJcbiAgbG9hZF9mdXNpb25fdGVtcGxhdGU6KHRlbXBsYXRlX25hbWUsIHVybCkgLT5cclxuICAgICQuYWpheFxyXG4gICAgICB1cmw6IHVybFxyXG4gICAgICBkYXRhVHlwZTogJ2pzb24nXHJcbiAgICAgIGNhY2hlOiB0cnVlXHJcbiAgICAgIHN1Y2Nlc3M6ICh0ZW1wbGF0ZV9qc29uKSA9PlxyXG4gICAgICAgIHQgPSBjb252ZXJ0X2Z1c2lvbl90ZW1wbGF0ZSB0ZW1wbGF0ZV9qc29uXHJcbiAgICAgICAgQGFkZF90ZW1wbGF0ZSh0ZW1wbGF0ZV9uYW1lLCB0KVxyXG4gICAgICAgIHJldHVyblxyXG5cclxuXHJcbiAgZ2V0X25hbWVzOiAtPlxyXG4gICAgKHQubmFtZSBmb3IgdCBpbiBAbGlzdClcclxuXHJcbiAgZ2V0X2luZGV4X2J5X25hbWU6IChuYW1lKSAtPlxyXG4gICAgZm9yIHQsaSBpbiBAbGlzdFxyXG4gICAgICBpZiB0Lm5hbWUgaXMgbmFtZVxyXG4gICAgICAgIHJldHVybiBpXHJcbiAgICAgcmV0dXJuIC0xXHJcblxyXG4gIGdldF9odG1sOiAoaW5kLCBkYXRhKSAtPlxyXG4gICAgaWYgKGluZCBpcyAtMSkgdGhlbiByZXR1cm4gIFwiXCJcclxuICAgIFxyXG4gICAgaWYgQGxpc3RbaW5kXVxyXG4gICAgICByZXR1cm4gQGxpc3RbaW5kXS5yZW5kZXIoZGF0YSlcclxuICAgIGVsc2VcclxuICAgICAgcmV0dXJuIFwiXCJcclxuXHJcbiAgYWN0aXZhdGU6IChpbmQsIHRwbF9uYW1lKSAtPlxyXG4gICAgaWYgQGxpc3RbaW5kXVxyXG4gICAgICBAbGlzdFtpbmRdLmFjdGl2YXRlIHRwbF9uYW1lXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRlbXBsYXRlczJcclxuIl19
