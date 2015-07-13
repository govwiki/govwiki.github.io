(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var add_marker, bounds_timeout, clear, create_info_window, geocode, geocode_addr, get_icon, get_records, get_records2, map, on_bounds_changed, on_bounds_changed_later, pinImage;

bounds_timeout = void 0;

map = new GMaps({
  el: '#govmap',
  lat: 37,
  lng: -119,
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
var GovSelector, Templates2, activate_tab, active_tab, adjust_typeahead_width, build_select_element, build_selector, focus_search_field, get_elected_officials, get_financial_statements, get_record, get_record2, gov_selector, govmap, livereload, router, start_adjusting_typeahead_width, templates;

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

router = new Grapnel;

router.get(':id', function(req) {
  var elected_officials, get_elected_officials, id;
  id = req.params.id;
  console.log("ROUTER ID=" + id);
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
  return elected_officials = get_elected_officials(id, 25, function(elected_officials_data, textStatus, jqXHR) {
    var data;
    data = new Object();
    data._id = id;
    data.elected_officials = elected_officials_data;
    data.gov_name = "";
    data.gov_type = "";
    data.state = "";
    $('#details').html(templates.get_html(0, data));
    get_record2(data._id);
    activate_tab();
    GOVWIKI.show_data_page();
  });
});

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

$(document).tooltip({
  selector: "[class='media-tooltip']",
  trigger: 'click'
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
    router.navigate(data._id);
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
      fields: "govs_id,title,full_name,email_address,photo_url,term_expires,telephone_number",
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
    GOVWIKI.show_data_page();
    return router.navigate(rec._id);
  };
})(this);

window.GOVWIKI.show_record2 = (function(_this) {
  return function(rec) {
    return get_elected_officials(rec._id, 25, function(data, textStatus, jqXHR) {
      rec.elected_officials = data;
      $('#details').html(templates.get_html(0, rec));
      get_record2(rec._id);
      activate_tab();
      GOVWIKI.show_data_page();
      return router.navigate(rec._id);
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

window.onhashchange = function(e) {
  var h;
  h = window.location.hash;
  if (!h) {
    return GOVWIKI.show_search_page();
  }
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
    return new RegExp("" + w, 'i');
  });
  return [words, regs];
};

module.exports = QueryMather;


},{}],5:[function(require,module,exports){

/*
 * file: templates2.coffee ----------------------------------------------------------------------
 *
 * Class to manage templates and render data on html page.
 *
 * The main method : render(data), get_html(data)
#-------------------------------------------------------------------------------------------------
 */
var Templates2, add_other_tab_to_layout, convert_fusion_template, currency, fieldNames, fieldNamesHelp, get_layout_fields, get_record_fields, get_unmentioned_fields, render_field, render_field_name, render_field_name_help, render_field_value, render_fields, render_financial_fields, render_subheading, render_tabs, toTitleCase, under,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

fieldNames = {};

fieldNamesHelp = {};

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
      if (v.length > 20 && n === "open_enrollment_schools") {
        return v = v.substring(0, 19) + ("<div style='display:inline;color:#074d71'  title='" + v + "'>&hellip;</div>");
      } else {
        return v;
      }
    }
  }
};

render_field_name_help = function(fName) {
  return fieldNamesHelp[fName];
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
    return "<div>\n    <span class='f-nam'>" + (render_field_name(fName)) + "<div></span>\n    <span class='f-val'>" + (render_field_value(fName, data)) + "</span>\n</div>";
  }
};

render_subheading = function(fName, mask, notFirst) {
  var s;
  s = '';
  fName = render_field_name(fName);
  if (mask === "heading") {
    if (notFirst !== 0) {
      s += "<br/>";
    }
    s += "<div><span class='f-nam'>" + fName + "</span><span class='f-val'> </span></div>";
  }
  return s;
};

render_fields = function(fields, data, template) {
  var fName, fNameHelp, fValue, field, h, i, j, len;
  h = '';
  for (i = j = 0, len = fields.length; j < len; i = ++j) {
    field = fields[i];
    if (typeof field === "object") {
      if (field.mask === "heading") {
        h += render_subheading(field.name, field.mask, i);
        fValue = '';
      } else {
        fValue = render_field_value(field.name, field.mask, data);
        if ('' !== fValue && fValue !== '0') {
          fName = render_field_name(field.name);
          fNameHelp = render_field_name_help(field.name);
        } else {
          fValue = '';
        }
      }
    } else {
      fValue = render_field_value(field, '', data);
      if ('' !== fValue) {
        fName = render_field_name(field);
        fNameHelp = render_field_name_help(fName);
      }
    }
    if ('' !== fValue) {
      h += template({
        name: fName,
        value: fValue,
        help: fNameHelp
      });
    }
  }
  return h;
};

render_financial_fields = function(data, template) {
  var category, field, fields_with_dollar_sign, h, j, len, mask, ref;
  h = '';
  mask = '0,0';
  category = '';
  for (j = 0, len = data.length; j < len; j++) {
    field = data[j];
    if (category !== field.category_name) {
      category = field.category_name;
      if (category === 'Overview') {
        h += template({
          name: "<b>" + category + "</b>",
          genfund: '',
          otherfunds: '',
          totalfunds: ''
        });
      } else if (category === 'Revenues') {
        h += '</br>';
        h += "<b>" + template({
          name: category,
          genfund: "General Fund",
          otherfunds: "Other Funds",
          totalfunds: "Total Gov. Funds"
        }) + "</b>";
      } else {
        h += '</br>';
        h += template({
          name: "<b>" + category + "</b>",
          genfund: '',
          otherfunds: '',
          totalfunds: ''
        });
      }
    }
    fields_with_dollar_sign = ['Taxes', 'Capital outlay', 'Total Revenues', 'Total Expenditures', 'Surplus / (Deficit)'];
    if (field.caption === 'General Fund Balance' || field.caption === 'Long Term Debt') {
      h += template({
        name: field.caption,
        genfund: currency(field.genfund, mask, '<span class="currency-sign">$</span>')
      });
    } else if (ref = field.caption, indexOf.call(fields_with_dollar_sign, ref) >= 0) {
      h += template({
        name: field.caption,
        genfund: currency(field.genfund, mask, '<span class="currency-sign">$</span>'),
        otherfunds: currency(field.otherfunds, mask, '<span class="currency-sign">$</span>'),
        totalfunds: currency(field.totalfunds, mask, '<span class="currency-sign">$</span>')
      });
    } else {
      h += template({
        name: field.caption,
        genfund: currency(field.genfund, mask),
        otherfunds: currency(field.otherfunds, mask),
        totalfunds: currency(field.totalfunds, mask)
      });
    }
  }
  return h;
};

under = function(s) {
  return s.replace(/[\s\+\-]/g, '_');
};

toTitleCase = function(str) {
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

currency = function(n, mask, sign) {
  var s;
  if (sign == null) {
    sign = '';
  }
  n = numeral(n);
  if (n < 0) {
    s = n.format(mask).toString();
    s = s.replace(/-/g, '');
    return "(" + sign + s + ")";
  }
  n = n.format(mask);
  return "" + sign + n;
};

render_tabs = function(initial_layout, data, tabset, parent) {
  var detail_data, drawChart, h, i, j, layout, layout_data, len, len1, len2, m, o, official, official_data, plot_handles, ref, tab, templates;
  layout = initial_layout;
  templates = parent.templates;
  plot_handles = {};
  layout_data = {
    title: data.gov_name,
    wikipedia_page_exists: data.wikipedia_page_exists,
    wikipedia_page_name: data.wikipedia_page_name,
    transparent_california_page_name: data.transparent_california_page_name,
    latest_audit_url: data.latest_audit_url,
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
            title: '' !== official.title ? "Title: " + official.title : void 0,
            name: '' !== official.full_name ? "Name: " + official.full_name : void 0,
            email: null !== official.email_address ? "Email: " + official.email_address : void 0,
            telephonenumber: null !== official.telephone_number && void 0 !== official.telephone_number ? "Telephone Number: " + official.telephone_number : void 0,
            termexpires: null !== official.term_expires ? "Term Expires: " + official.term_expires : void 0
          };
          if ('' !== official.photo_url && official.photo_url !== null) {
            official_data.image = '<img src="' + official.photo_url + '" class="portrait" alt="" />';
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
        if (!plot_handles['median-comp-graph']) {
          drawChart = function() {
            return setTimeout((function() {
              var chart, formatter, options, vis_data;
              vis_data = new google.visualization.DataTable();
              vis_data.addColumn('string', 'Median Compensation');
              vis_data.addColumn('number', 'Wages');
              vis_data.addColumn('number', 'Bens.');
              vis_data.addRows([[toTitleCase(data.gov_name + '\n Employees'), data['median_salary_per_full_time_emp'], data['median_benefits_per_ft_emp']], ['All \n' + toTitleCase(data.gov_name + ' \n Residents'), data['median_wages_general_public'], data['median_benefits_general_public']]]);
              formatter = new google.visualization.NumberFormat({
                groupingSymbol: ',',
                fractionDigits: '0'
              });
              formatter.format(vis_data, 1);
              formatter.format(vis_data, 2);
              options = {
                'title': 'Median Total Compensation - Full Time Workers: \n Government vs. Private Sector',
                'width': 340,
                'height': 300,
                'isStacked': 'true',
                'colors': ['#005ce6', '#009933']
              };
              chart = new google.visualization.ColumnChart(document.getElementById('median-comp-graph'));
              chart.draw(vis_data, options);
            }), 1000);
          };
          google.load('visualization', '1.0', {
            'callback': drawChart(),
            'packages': 'corechart'
          });
          plot_handles['median-comp-graph'] = 'median-comp-graph';
        }
        if (!plot_handles['median-pension-graph']) {
          drawChart = function() {
            return setTimeout((function() {
              var chart, formatter, options, vis_data;
              vis_data = new google.visualization.DataTable();
              vis_data.addColumn('string', 'Median Pension');
              vis_data.addColumn('number', 'Wages');
              vis_data.addRows([['Pension for \n Retiree w/ 30 Years', data['median_pension_30_year_retiree']]]);
              formatter = new google.visualization.NumberFormat({
                groupingSymbol: ',',
                fractionDigits: '0'
              });
              formatter.format(vis_data, 1);
              options = {
                'title': 'Median Total Pension',
                'width': 340,
                'height': 300,
                'isStacked': 'true',
                'colors': ['#005ce6', '#009933'],
                'chartArea.width': '50%'
              };
              chart = new google.visualization.ColumnChart(document.getElementById('median-pension-graph'));
              chart.draw(vis_data, options);
            }), 1000);
          };
          google.load('visualization', '1.0', {
            'callback': drawChart(),
            'packages': 'corechart'
          });
          plot_handles['median-pension-graph'] = 'median-pension-graph';
        }
        break;
      case 'Financial Health':
        h = '';
        h += render_fields(tab.fields, data, templates['tabdetail-namevalue-template']);
        detail_data.tabcontent += templates['tabdetail-financial-health-template']({
          content: h
        });
        if (!plot_handles['public-safety-pie']) {
          drawChart = function() {};
          setTimeout((function() {
            var chart, options, vis_data;
            vis_data = new google.visualization.DataTable();
            vis_data.addColumn('string', 'Public Safety Expense');
            vis_data.addColumn('number', 'Total');
            vis_data.addRows([['Public Safety Expense', 100 - data['public_safety_exp_over_tot_gov_fund_revenue']], ['Other Governmental \n Fund Revenue', data['public_safety_exp_over_tot_gov_fund_revenue']]]);
            options = {
              'title': 'Public safety expense',
              'width': 340,
              'height': 300,
              'is3D': 'true',
              'colors': ['#005ce6', '#009933'],
              'slices': {
                1: {
                  offset: 0.2
                }
              },
              'pieStartAngle': 20
            };
            chart = new google.visualization.PieChart(document.getElementById('public-safety-pie'));
            chart.draw(vis_data, options);
          }), 1000);
        }
        google.load('visualization', '1.0', {
          'callback': drawChart(),
          'packages': 'corechart'
        });
        plot_handles['public-safety-pie'] = 'public-safety-pie';
        if (!plot_handles['fin-health-revenue-graph']) {
          drawChart = function() {
            return setTimeout((function() {
              var chart, options, vis_data;
              vis_data = new google.visualization.DataTable();
              vis_data.addColumn('string', 'Per Capita');
              vis_data.addColumn('number', 'Rev.');
              vis_data.addRows([['Total Revenue \n Per Capita', data['total_revenue_per_capita']], ['Median Total Revenue Per \n Capita For All Cities', 420]]);
              options = {
                'title': 'Total Revenue',
                'width': 340,
                'height': 300,
                'isStacked': 'true',
                'colors': ['#005ce6', '#009933'],
                'chartArea.width': '50%'
              };
              chart = new google.visualization.ColumnChart(document.getElementById('fin-health-revenue-graph'));
              chart.draw(vis_data, options);
            }), 1000);
          };
          google.load('visualization', '1.0', {
            'callback': drawChart(),
            'packages': 'corechart'
          });
          plot_handles['fin-health-revenue-graph'] = 'fin-health-revenue-graph';
        }
        if (!plot_handles['fin-health-expenditures-graph']) {
          drawChart = function() {
            return setTimeout((function() {
              var chart, options, vis_data;
              vis_data = new google.visualization.DataTable();
              vis_data.addColumn('string', 'Per Capita');
              vis_data.addColumn('number', 'Exp.');
              vis_data.addRows([['Total Expenditures \n Per Capita', data['total_expenditures_per_capita']], ['Median Total \n Expenditures Per Capita \n For All Cities', 420]]);
              options = {
                'title': 'Total Expenditures',
                'width': 340,
                'height': 300,
                'isStacked': 'true',
                'colors': ['#005ce6', '#009933'],
                'chartArea.width': '50%'
              };
              chart = new google.visualization.ColumnChart(document.getElementById('fin-health-expenditures-graph'));
              chart.draw(vis_data, options);
            }), 1000);
          };
          google.load('visualization', '1.0', {
            'callback': drawChart(),
            'packages': 'corechart'
          });
          plot_handles['fin-health-expenditures-graph'] = 'fin-health-expenditures-graph';
        }
        break;
      case 'Financial Statements':
        if (data.financial_statements) {
          h = '';
          h += render_financial_fields(data.financial_statements, templates['tabdetail-finstatement-template']);
          detail_data.tabcontent += templates['tabdetail-financial-statements-template']({
            content: h
          });
          if (!plot_handles['total-expenditures-pie']) {
            drawChart = function() {};
            setTimeout((function() {
              var chart, item, len3, options, p, r, ref1, rows, vis_data;
              vis_data = new google.visualization.DataTable();
              vis_data.addColumn('string', 'Total Gov. Expenditures');
              vis_data.addColumn('number', 'Total');
              rows = [];
              ref1 = data.financial_statements;
              for (p = 0, len3 = ref1.length; p < len3; p++) {
                item = ref1[p];
                if ((item.category_name === "Expenditures") && (item.caption !== "Total Expenditures")) {
                  r = [item.caption, parseInt(item.totalfunds)];
                  rows.push(r);
                }
              }
              vis_data.addRows(rows);
              options = {
                'title': 'Total Expenditures',
                'width': 400,
                'height': 350,
                'pieStartAngle': 20
              };
              chart = new google.visualization.PieChart(document.getElementById('total-expenditures-pie'));
              chart.draw(vis_data, options);
            }), 1000);
          }
          google.load('visualization', '1.0', {
            'callback': drawChart(),
            'packages': 'corechart'
          });
          plot_handles['total-expenditures-pie'] = 'total-expenditures-pie';
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
  var categories, categories_array, categories_sort, category, col_hash, fieldname, fields, get_col_hash, hash_to_array, i, j, len, len1, len2, len3, m, n, o, obj, p, placeholder_count, ref, ref1, row, tab_hash, tab_newhash, tabs, val;
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
    fieldNamesHelp[fieldname] = val('help_text', row, col_hash);
    if (category) {
      if (tab_hash[category] == null) {
        tab_hash[category] = [];
      }
      tab_hash[category].push({
        n: val('n', row, col_hash),
        name: fieldname,
        mask: val('mask', row, col_hash)
      });
    }
  }
  categories = Object.keys(tab_hash);
  categories_sort = {};
  for (m = 0, len1 = categories.length; m < len1; m++) {
    category = categories[m];
    if (!categories_sort[category]) {
      categories_sort[category] = tab_hash[category][0].n;
    }
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
  categories_array = [];
  for (category in categories_sort) {
    n = categories_sort[category];
    categories_array.push({
      category: category,
      n: n
    });
  }
  categories_array.sort(function(a, b) {
    return a.n - b.n;
  });
  tab_newhash = {};
  for (p = 0, len3 = categories_array.length; p < len3; p++) {
    category = categories_array[p];
    tab_newhash[category.category] = tab_hash[category.category];
  }
  tabs = hash_to_array(tab_newhash);
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiRDpcXFByb2plY3RzXFxnb3Z3aWtpLWRldi51c1xcY29mZmVlXFxnb3ZtYXAuY29mZmVlIiwiRDpcXFByb2plY3RzXFxnb3Z3aWtpLWRldi51c1xcY29mZmVlXFxnb3ZzZWxlY3Rvci5jb2ZmZWUiLCJEOlxcUHJvamVjdHNcXGdvdndpa2ktZGV2LnVzXFxjb2ZmZWVcXG1haW4uY29mZmVlIiwiRDpcXFByb2plY3RzXFxnb3Z3aWtpLWRldi51c1xcY29mZmVlXFxxdWVyeW1hdGNoZXIuY29mZmVlIiwiRDpcXFByb2plY3RzXFxnb3Z3aWtpLWRldi51c1xcY29mZmVlXFx0ZW1wbGF0ZXMyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLElBQUE7O0FBQUEsY0FBQSxHQUFlOztBQUdmLEdBQUEsR0FBVSxJQUFBLEtBQUEsQ0FDUjtFQUFBLEVBQUEsRUFBSSxTQUFKO0VBQ0EsR0FBQSxFQUFLLEVBREw7RUFFQSxHQUFBLEVBQUssQ0FBQyxHQUZOO0VBR0EsSUFBQSxFQUFNLENBSE47RUFJQSxXQUFBLEVBQWEsS0FKYjtFQUtBLFVBQUEsRUFBWSxLQUxaO0VBTUEsV0FBQSxFQUFhLElBTmI7RUFPQSxrQkFBQSxFQUNFO0lBQUEsS0FBQSxFQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBcEM7R0FSRjtFQVNBLGNBQUEsRUFBZ0IsU0FBQTtXQUNkLHVCQUFBLENBQXdCLEdBQXhCO0VBRGMsQ0FUaEI7Q0FEUTs7QUFjVix1QkFBQSxHQUEyQixTQUFDLElBQUQ7RUFDekIsWUFBQSxDQUFhLGNBQWI7U0FDQSxjQUFBLEdBQWlCLFVBQUEsQ0FBVyxpQkFBWCxFQUE4QixJQUE5QjtBQUZROztBQUszQixpQkFBQSxHQUFtQixTQUFDLENBQUQ7QUFDakIsTUFBQTtFQUFB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Ozs7O0FBSVosTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiYm91bmRzX3RpbWVvdXQ9dW5kZWZpbmVkXHJcblxyXG5cclxubWFwID0gbmV3IEdNYXBzXHJcbiAgZWw6ICcjZ292bWFwJ1xyXG4gIGxhdDogMzdcclxuICBsbmc6IC0xMTlcclxuICB6b29tOiA2XHJcbiAgc2Nyb2xsd2hlZWw6IGZhbHNlXHJcbiAgcGFuQ29udHJvbDogZmFsc2VcclxuICB6b29tQ29udHJvbDogdHJ1ZVxyXG4gIHpvb21Db250cm9sT3B0aW9uczpcclxuICAgIHN0eWxlOiBnb29nbGUubWFwcy5ab29tQ29udHJvbFN0eWxlLlNNQUxMXHJcbiAgYm91bmRzX2NoYW5nZWQ6IC0+XHJcbiAgICBvbl9ib3VuZHNfY2hhbmdlZF9sYXRlciAyMDBcclxuXHJcblxyXG5vbl9ib3VuZHNfY2hhbmdlZF9sYXRlciAgPSAobXNlYykgIC0+XHJcbiAgY2xlYXJUaW1lb3V0IGJvdW5kc190aW1lb3V0XHJcbiAgYm91bmRzX3RpbWVvdXQgPSBzZXRUaW1lb3V0IG9uX2JvdW5kc19jaGFuZ2VkLCBtc2VjXHJcblxyXG4gICAgXHJcbm9uX2JvdW5kc19jaGFuZ2VkID0oZSkgLT5cclxuICBjb25zb2xlLmxvZyBcImJvdW5kc19jaGFuZ2VkXCJcclxuICBiPW1hcC5nZXRCb3VuZHMoKVxyXG4gIHVybF92YWx1ZT1iLnRvVXJsVmFsdWUoKVxyXG4gIG5lPWIuZ2V0Tm9ydGhFYXN0KClcclxuICBzdz1iLmdldFNvdXRoV2VzdCgpXHJcbiAgbmVfbGF0PW5lLmxhdCgpXHJcbiAgbmVfbG5nPW5lLmxuZygpXHJcbiAgc3dfbGF0PXN3LmxhdCgpXHJcbiAgc3dfbG5nPXN3LmxuZygpXHJcbiAgc3QgPSBHT1ZXSUtJLnN0YXRlX2ZpbHRlclxyXG4gIHR5ID0gR09WV0lLSS5nb3ZfdHlwZV9maWx0ZXJcclxuXHJcbiAgIyMjXHJcbiAgIyBCdWlsZCB0aGUgcXVlcnkuXHJcbiAgcT1cIlwiXCIgXCJsYXRpdHVkZVwiOntcIiRsdFwiOiN7bmVfbGF0fSxcIiRndFwiOiN7c3dfbGF0fX0sXCJsb25naXR1ZGVcIjp7XCIkbHRcIjoje25lX2xuZ30sXCIkZ3RcIjoje3N3X2xuZ319XCJcIlwiXHJcbiAgIyBBZGQgZmlsdGVycyBpZiB0aGV5IGV4aXN0XHJcbiAgcSs9XCJcIlwiLFwic3RhdGVcIjpcIiN7c3R9XCIgXCJcIlwiIGlmIHN0XHJcbiAgcSs9XCJcIlwiLFwiZ292X3R5cGVcIjpcIiN7dHl9XCIgXCJcIlwiIGlmIHR5XHJcblxyXG5cclxuICBnZXRfcmVjb3JkcyBxLCAyMDAsICAoZGF0YSkgLT5cclxuICAgICNjb25zb2xlLmxvZyBcImxlbmd0aD0je2RhdGEubGVuZ3RofVwiXHJcbiAgICAjY29uc29sZS5sb2cgXCJsYXQ6ICN7bmVfbGF0fSwje3N3X2xhdH0gbG5nOiAje25lX2xuZ30sICN7c3dfbG5nfVwiXHJcbiAgICBtYXAucmVtb3ZlTWFya2VycygpXHJcbiAgICBhZGRfbWFya2VyKHJlYykgZm9yIHJlYyBpbiBkYXRhXHJcbiAgICByZXR1cm5cclxuICAjIyNcclxuXHJcbiAgIyBCdWlsZCB0aGUgcXVlcnkgMi5cclxuICBxMj1cIlwiXCIgbGF0aXR1ZGU8I3tuZV9sYXR9IEFORCBsYXRpdHVkZT4je3N3X2xhdH0gQU5EIGxvbmdpdHVkZTwje25lX2xuZ30gQU5EIGxvbmdpdHVkZT4je3N3X2xuZ30gXCJcIlwiXHJcbiAgIyBBZGQgZmlsdGVycyBpZiB0aGV5IGV4aXN0XHJcbiAgcTIrPVwiXCJcIiBBTkQgc3RhdGU9XCIje3N0fVwiIFwiXCJcIiBpZiBzdFxyXG4gIHEyKz1cIlwiXCIgQU5EIGdvdl90eXBlPVwiI3t0eX1cIiBcIlwiXCIgaWYgdHlcclxuXHJcblxyXG4gIGdldF9yZWNvcmRzMiBxMiwgMjAwLCAgKGRhdGEpIC0+XHJcbiAgICAjY29uc29sZS5sb2cgXCJsZW5ndGg9I3tkYXRhLmxlbmd0aH1cIlxyXG4gICAgI2NvbnNvbGUubG9nIFwibGF0OiAje25lX2xhdH0sI3tzd19sYXR9IGxuZzogI3tuZV9sbmd9LCAje3N3X2xuZ31cIlxyXG4gICAgbWFwLnJlbW92ZU1hcmtlcnMoKVxyXG4gICAgYWRkX21hcmtlcihyZWMpIGZvciByZWMgaW4gZGF0YS5yZWNvcmRcclxuICAgIHJldHVyblxyXG5cclxuXHJcblxyXG5nZXRfaWNvbiA9KGdvdl90eXBlKSAtPlxyXG4gIFxyXG4gIF9jaXJjbGUgPShjb2xvciktPlxyXG4gICAgcGF0aDogZ29vZ2xlLm1hcHMuU3ltYm9sUGF0aC5DSVJDTEVcclxuICAgIGZpbGxPcGFjaXR5OiAwLjVcclxuICAgIGZpbGxDb2xvcjpjb2xvclxyXG4gICAgc3Ryb2tlV2VpZ2h0OiAxXHJcbiAgICBzdHJva2VDb2xvcjond2hpdGUnXHJcbiAgICAjc3Ryb2tlUG9zaXRpb246IGdvb2dsZS5tYXBzLlN0cm9rZVBvc2l0aW9uLk9VVFNJREVcclxuICAgIHNjYWxlOjZcclxuXHJcbiAgc3dpdGNoIGdvdl90eXBlXHJcbiAgICB3aGVuICdHZW5lcmFsIFB1cnBvc2UnIHRoZW4gcmV0dXJuIF9jaXJjbGUgJyMwM0MnXHJcbiAgICB3aGVuICdDZW1ldGVyaWVzJyAgICAgIHRoZW4gcmV0dXJuIF9jaXJjbGUgJyMwMDAnXHJcbiAgICB3aGVuICdIb3NwaXRhbHMnICAgICAgIHRoZW4gcmV0dXJuIF9jaXJjbGUgJyMwQzAnXHJcbiAgICBlbHNlIHJldHVybiBfY2lyY2xlICcjRDIwJ1xyXG5cclxuXHJcblxyXG5cclxuYWRkX21hcmtlciA9KHJlYyktPlxyXG4gICNjb25zb2xlLmxvZyBcIiN7cmVjLnJhbmR9ICN7cmVjLmluY19pZH0gI3tyZWMuemlwfSAje3JlYy5sYXRpdHVkZX0gI3tyZWMubG9uZ2l0dWRlfSAje3JlYy5nb3ZfbmFtZX1cIlxyXG4gIG1hcC5hZGRNYXJrZXJcclxuICAgIGxhdDogcmVjLmxhdGl0dWRlXHJcbiAgICBsbmc6IHJlYy5sb25naXR1ZGVcclxuICAgIGljb246IGdldF9pY29uKHJlYy5nb3ZfdHlwZSlcclxuICAgIHRpdGxlOiAgXCIje3JlYy5nb3ZfbmFtZX0sICN7cmVjLmdvdl90eXBlfSAoI3tyZWMubGF0aXR1ZGV9LCAje3JlYy5sb25naXR1ZGV9KVwiXHJcbiAgICBpbmZvV2luZG93OlxyXG4gICAgICBjb250ZW50OiBjcmVhdGVfaW5mb193aW5kb3cgcmVjXHJcbiAgICBjbGljazogKGUpLT5cclxuICAgICAgI3dpbmRvdy5HT1ZXSUtJLnNob3dfcmVjb3JkIHJlY1xyXG4gICAgICB3aW5kb3cuR09WV0lLSS5zaG93X3JlY29yZDIgcmVjXHJcbiAgXHJcbiAgcmV0dXJuXHJcblxyXG5cclxuY3JlYXRlX2luZm9fd2luZG93ID0ocikgLT5cclxuICB3ID0gJCgnPGRpdj48L2Rpdj4nKVxyXG4gIC5hcHBlbmQgJChcIjxhIGhyZWY9JyMnPjxzdHJvbmc+I3tyLmdvdl9uYW1lfTwvc3Ryb25nPjwvYT5cIikuY2xpY2sgKGUpLT5cclxuICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgY29uc29sZS5sb2cgclxyXG4gICAgI3dpbmRvdy5HT1ZXSUtJLnNob3dfcmVjb3JkIHJcclxuICAgIHdpbmRvdy5HT1ZXSUtJLnNob3dfcmVjb3JkMiByXHJcblxyXG4gIC5hcHBlbmQgJChcIjxkaXY+ICN7ci5nb3ZfdHlwZX0gICN7ci5jaXR5fSAje3IuemlwfSAje3Iuc3RhdGV9PC9kaXY+XCIpXHJcbiAgcmV0dXJuIHdbMF1cclxuXHJcblxyXG5cclxuXHJcbmdldF9yZWNvcmRzID0gKHF1ZXJ5LCBsaW1pdCwgb25zdWNjZXNzKSAtPlxyXG4gICQuYWpheFxyXG4gICAgdXJsOiBcImh0dHBzOi8vYXBpLm1vbmdvbGFiLmNvbS9hcGkvMS9kYXRhYmFzZXMvZ292d2lraS9jb2xsZWN0aW9ucy9nb3ZzLz9xPXsje3F1ZXJ5fX0mZj17X2lkOjB9Jmw9I3tsaW1pdH0mcz17cmFuZDoxfSZhcGlLZXk9MFk1WF9RazJ1T0pSZEhKV0pLU1JXazZsNkpxVlRTMnlcIlxyXG4gICAgZGF0YVR5cGU6ICdqc29uJ1xyXG4gICAgY2FjaGU6IHRydWVcclxuICAgIHN1Y2Nlc3M6IG9uc3VjY2Vzc1xyXG4gICAgZXJyb3I6KGUpIC0+XHJcbiAgICAgIGNvbnNvbGUubG9nIGVcclxuXHJcblxyXG5nZXRfcmVjb3JkczIgPSAocXVlcnksIGxpbWl0LCBvbnN1Y2Nlc3MpIC0+XHJcbiAgJC5hamF4XHJcbiAgICB1cmw6XCJodHRwOi8vNDYuMTAxLjMuNzk6ODAvcmVzdC9kYi9nb3ZzXCJcclxuICAgIGRhdGE6XHJcbiAgICAgICNmaWx0ZXI6XCJsYXRpdHVkZT4zMiBBTkQgbGF0aXR1ZGU8MzQgQU5EIGxvbmdpdHVkZT4tODcgQU5EIGxvbmdpdHVkZTwtODZcIlxyXG4gICAgICBmaWx0ZXI6cXVlcnlcclxuICAgICAgZmllbGRzOlwiX2lkLGluY19pZCxnb3ZfbmFtZSxnb3ZfdHlwZSxjaXR5LHppcCxzdGF0ZSxsYXRpdHVkZSxsb25naXR1ZGVcIlxyXG4gICAgICBhcHBfbmFtZTpcImdvdndpa2lcIlxyXG4gICAgICBvcmRlcjpcInJhbmRcIlxyXG4gICAgICBsaW1pdDpsaW1pdFxyXG5cclxuICAgIGRhdGFUeXBlOiAnanNvbidcclxuICAgIGNhY2hlOiB0cnVlXHJcbiAgICBzdWNjZXNzOiBvbnN1Y2Nlc3NcclxuICAgIGVycm9yOihlKSAtPlxyXG4gICAgICBjb25zb2xlLmxvZyBlXHJcblxyXG4jIEdFT0NPRElORyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG5waW5JbWFnZSA9IG5ldyAoZ29vZ2xlLm1hcHMuTWFya2VySW1hZ2UpKFxyXG4gICdodHRwOi8vY2hhcnQuYXBpcy5nb29nbGUuY29tL2NoYXJ0P2Noc3Q9ZF9tYXBfcGluX2xldHRlciZjaGxkPVp8Nzc3N0JCfEZGRkZGRicgLFxyXG4gIG5ldyAoZ29vZ2xlLm1hcHMuU2l6ZSkoMjEsIDM0KSxcclxuICBuZXcgKGdvb2dsZS5tYXBzLlBvaW50KSgwLCAwKSxcclxuICBuZXcgKGdvb2dsZS5tYXBzLlBvaW50KSgxMCwgMzQpXHJcbiAgKVxyXG5cclxuXHJcbmdlb2NvZGVfYWRkciA9IChhZGRyLGRhdGEpIC0+XHJcbiAgR01hcHMuZ2VvY29kZVxyXG4gICAgYWRkcmVzczogYWRkclxyXG4gICAgY2FsbGJhY2s6IChyZXN1bHRzLCBzdGF0dXMpIC0+XHJcbiAgICAgIGlmIHN0YXR1cyA9PSAnT0snXHJcbiAgICAgICAgbGF0bG5nID0gcmVzdWx0c1swXS5nZW9tZXRyeS5sb2NhdGlvblxyXG4gICAgICAgIG1hcC5zZXRDZW50ZXIgbGF0bG5nLmxhdCgpLCBsYXRsbmcubG5nKClcclxuICAgICAgICBtYXAuYWRkTWFya2VyXHJcbiAgICAgICAgICBsYXQ6IGxhdGxuZy5sYXQoKVxyXG4gICAgICAgICAgbG5nOiBsYXRsbmcubG5nKClcclxuICAgICAgICAgIHNpemU6ICdzbWFsbCdcclxuICAgICAgICAgIHRpdGxlOiByZXN1bHRzWzBdLmZvcm1hdHRlZF9hZGRyZXNzXHJcbiAgICAgICAgICBpbmZvV2luZG93OlxyXG4gICAgICAgICAgICBjb250ZW50OiByZXN1bHRzWzBdLmZvcm1hdHRlZF9hZGRyZXNzXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgZGF0YVxyXG4gICAgICAgICAgbWFwLmFkZE1hcmtlclxyXG4gICAgICAgICAgICBsYXQ6IGRhdGEubGF0aXR1ZGVcclxuICAgICAgICAgICAgbG5nOiBkYXRhLmxvbmdpdHVkZVxyXG4gICAgICAgICAgICBzaXplOiAnc21hbGwnXHJcbiAgICAgICAgICAgIGNvbG9yOiAnYmx1ZSdcclxuICAgICAgICAgICAgaWNvbjogcGluSW1hZ2VcclxuICAgICAgICAgICAgdGl0bGU6ICBcIiN7ZGF0YS5sYXRpdHVkZX0gI3tkYXRhLmxvbmdpdHVkZX1cIlxyXG4gICAgICAgICAgICBpbmZvV2luZG93OlxyXG4gICAgICAgICAgICAgIGNvbnRlbnQ6IFwiI3tkYXRhLmxhdGl0dWRlfSAje2RhdGEubG9uZ2l0dWRlfVwiXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICQoJy5nb3ZtYXAtZm91bmQnKS5odG1sIFwiPHN0cm9uZz5GT1VORDogPC9zdHJvbmc+I3tyZXN1bHRzWzBdLmZvcm1hdHRlZF9hZGRyZXNzfVwiXHJcbiAgICAgIHJldHVyblxyXG5cclxuXHJcbmNsZWFyPShzKS0+XHJcbiAgcmV0dXJuIGlmIHMubWF0Y2goLyBib3ggL2kpIHRoZW4gJycgZWxzZSBzXHJcblxyXG5nZW9jb2RlID0gKGRhdGEpIC0+XHJcbiAgYWRkciA9IFwiI3tjbGVhcihkYXRhLmFkZHJlc3MxKX0gI3tjbGVhcihkYXRhLmFkZHJlc3MyKX0sICN7ZGF0YS5jaXR5fSwgI3tkYXRhLnN0YXRlfSAje2RhdGEuemlwfSwgVVNBXCJcclxuICAkKCcjZ292YWRkcmVzcycpLnZhbChhZGRyKVxyXG4gIGdlb2NvZGVfYWRkciBhZGRyLCBkYXRhXHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPVxyXG4gIGdlb2NvZGU6IGdlb2NvZGVcclxuICBnb2NvZGVfYWRkcjogZ2VvY29kZV9hZGRyXHJcbiAgb25fYm91bmRzX2NoYW5nZWQ6IG9uX2JvdW5kc19jaGFuZ2VkXHJcbiAgb25fYm91bmRzX2NoYW5nZWRfbGF0ZXI6IG9uX2JvdW5kc19jaGFuZ2VkX2xhdGVyXHJcbiIsIlxyXG5xdWVyeV9tYXRjaGVyID0gcmVxdWlyZSgnLi9xdWVyeW1hdGNoZXIuY29mZmVlJylcclxuXHJcbmNsYXNzIEdvdlNlbGVjdG9yXHJcbiAgXHJcbiAgIyBzdHViIG9mIGEgY2FsbGJhY2sgdG8gZW52b2tlIHdoZW4gdGhlIHVzZXIgc2VsZWN0cyBzb21ldGhpbmdcclxuICBvbl9zZWxlY3RlZDogKGV2dCwgZGF0YSwgbmFtZSkgLT5cclxuXHJcblxyXG4gIGNvbnN0cnVjdG9yOiAoQGh0bWxfc2VsZWN0b3IsIGRvY3NfdXJsLCBAbnVtX2l0ZW1zKSAtPlxyXG4gICAgJC5hamF4XHJcbiAgICAgIHVybDogZG9jc191cmxcclxuICAgICAgZGF0YVR5cGU6ICdqc29uJ1xyXG4gICAgICBjYWNoZTogdHJ1ZVxyXG4gICAgICBzdWNjZXNzOiBAc3RhcnRTdWdnZXN0aW9uXHJcbiAgICAgIFxyXG5cclxuXHJcblxyXG4gIHN1Z2dlc3Rpb25UZW1wbGF0ZSA6IEhhbmRsZWJhcnMuY29tcGlsZShcIlwiXCJcclxuICAgIDxkaXYgY2xhc3M9XCJzdWdnLWJveFwiPlxyXG4gICAgICA8ZGl2IGNsYXNzPVwic3VnZy1zdGF0ZVwiPnt7e3N0YXRlfX19PC9kaXY+XHJcbiAgICAgIDxkaXYgY2xhc3M9XCJzdWdnLW5hbWVcIj57e3tnb3ZfbmFtZX19fTwvZGl2PlxyXG4gICAgICA8ZGl2IGNsYXNzPVwic3VnZy10eXBlXCI+e3t7Z292X3R5cGV9fX08L2Rpdj5cclxuICAgIDwvZGl2PlwiXCJcIilcclxuXHJcblxyXG5cclxuICBlbnRlcmVkX3ZhbHVlID0gXCJcIlxyXG5cclxuICBnb3ZzX2FycmF5ID0gW11cclxuXHJcbiAgY291bnRfZ292cyA6ICgpIC0+XHJcbiAgICBjb3VudCA9MFxyXG4gICAgZm9yIGQgaW4gQGdvdnNfYXJyYXlcclxuICAgICAgaWYgR09WV0lLSS5zdGF0ZV9maWx0ZXIgYW5kIGQuc3RhdGUgaXNudCBHT1ZXSUtJLnN0YXRlX2ZpbHRlciB0aGVuIGNvbnRpbnVlXHJcbiAgICAgIGlmIEdPVldJS0kuZ292X3R5cGVfZmlsdGVyIGFuZCBkLmdvdl90eXBlIGlzbnQgR09WV0lLSS5nb3ZfdHlwZV9maWx0ZXIgdGhlbiBjb250aW51ZVxyXG4gICAgICBjb3VudCsrXHJcbiAgICByZXR1cm4gY291bnRcclxuXHJcblxyXG4gIHN0YXJ0U3VnZ2VzdGlvbiA6IChnb3ZzKSA9PlxyXG4gICAgI0Bnb3ZzX2FycmF5ID0gZ292c1xyXG4gICAgQGdvdnNfYXJyYXkgPSBnb3ZzLnJlY29yZFxyXG4gICAgJCgnLnR5cGVhaGVhZCcpLmtleXVwIChldmVudCkgPT5cclxuICAgICAgQGVudGVyZWRfdmFsdWUgPSAkKGV2ZW50LnRhcmdldCkudmFsKClcclxuICAgIFxyXG4gICAgJChAaHRtbF9zZWxlY3RvcikuYXR0ciAncGxhY2Vob2xkZXInLCAnR09WRVJOTUVOVCBOQU1FJ1xyXG4gICAgJChAaHRtbF9zZWxlY3RvcikudHlwZWFoZWFkKFxyXG4gICAgICAgIGhpbnQ6IGZhbHNlXHJcbiAgICAgICAgaGlnaGxpZ2h0OiBmYWxzZVxyXG4gICAgICAgIG1pbkxlbmd0aDogMVxyXG4gICAgICAgIGNsYXNzTmFtZXM6XHJcbiAgICAgICAgXHRtZW51OiAndHQtZHJvcGRvd24tbWVudSdcclxuICAgICAgLFxyXG4gICAgICAgIG5hbWU6ICdnb3ZfbmFtZSdcclxuICAgICAgICBkaXNwbGF5S2V5OiAnZ292X25hbWUnXHJcbiAgICAgICAgc291cmNlOiBxdWVyeV9tYXRjaGVyKEBnb3ZzX2FycmF5LCBAbnVtX2l0ZW1zKVxyXG4gICAgICAgICNzb3VyY2U6IGJsb29kaG91bmQudHRBZGFwdGVyKClcclxuICAgICAgICB0ZW1wbGF0ZXM6IHN1Z2dlc3Rpb246IEBzdWdnZXN0aW9uVGVtcGxhdGVcclxuICAgIClcclxuICAgIC5vbiAndHlwZWFoZWFkOnNlbGVjdGVkJywgIChldnQsIGRhdGEsIG5hbWUpID0+XHJcbiAgICAgICAgJCgnLnR5cGVhaGVhZCcpLnR5cGVhaGVhZCAndmFsJywgQGVudGVyZWRfdmFsdWVcclxuICAgICAgICBAb25fc2VsZWN0ZWQoZXZ0LCBkYXRhLCBuYW1lKVxyXG4gICBcclxuICAgIC5vbiAndHlwZWFoZWFkOmN1cnNvcmNoYW5nZWQnLCAoZXZ0LCBkYXRhLCBuYW1lKSA9PlxyXG4gICAgICAgICQoJy50eXBlYWhlYWQnKS52YWwgQGVudGVyZWRfdmFsdWVcclxuICAgIFxyXG5cclxuICAgICQoJy5nb3YtY291bnRlcicpLnRleHQgQGNvdW50X2dvdnMoKVxyXG4gICAgcmV0dXJuXHJcblxyXG5cclxuXHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHM9R292U2VsZWN0b3JcclxuXHJcblxyXG5cclxuIiwiIyMjXHJcbmZpbGU6IG1haW4uY29mZmUgLS0gVGhlIGVudHJ5IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgOlxyXG5nb3ZfZmluZGVyID0gbmV3IEdvdkZpbmRlclxyXG5nb3ZfZGV0YWlscyA9IG5ldyBHb3ZEZXRhaWxzXHJcbmdvdl9maW5kZXIub25fc2VsZWN0ID0gZ292X2RldGFpbHMuc2hvd1xyXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4jIyNcclxuXHJcbkdvdlNlbGVjdG9yID0gcmVxdWlyZSAnLi9nb3ZzZWxlY3Rvci5jb2ZmZWUnXHJcbiNfanFncyAgICAgICA9IHJlcXVpcmUgJy4vanF1ZXJ5LmdvdnNlbGVjdG9yLmNvZmZlZSdcclxuVGVtcGxhdGVzMiAgICAgID0gcmVxdWlyZSAnLi90ZW1wbGF0ZXMyLmNvZmZlZSdcclxuZ292bWFwICAgICAgPSByZXF1aXJlICcuL2dvdm1hcC5jb2ZmZWUnXHJcbiNzY3JvbGx0byA9IHJlcXVpcmUgJy4uL2Jvd2VyX2NvbXBvbmVudHMvanF1ZXJ5LnNjcm9sbFRvL2pxdWVyeS5zY3JvbGxUby5qcydcclxuXHJcbndpbmRvdy5HT1ZXSUtJID1cclxuICBzdGF0ZV9maWx0ZXIgOiAnJ1xyXG4gIGdvdl90eXBlX2ZpbHRlciA6ICcnXHJcblxyXG4gIHNob3dfc2VhcmNoX3BhZ2U6ICgpIC0+XHJcbiAgICAkKHdpbmRvdykuc2Nyb2xsVG8oJzBweCcsMTApXHJcbiAgICAkKCcjZGF0YUNvbnRhaW5lcicpLmhpZGUoKVxyXG4gICAgJCgnI3NlYXJjaEljb24nKS5oaWRlKClcclxuICAgICQoJyNzZWFyY2hDb250YWluZXInKS5mYWRlSW4oMzAwKVxyXG4gICAgZm9jdXNfc2VhcmNoX2ZpZWxkIDUwMFxyXG4gICAgXHJcbiAgc2hvd19kYXRhX3BhZ2U6ICgpIC0+XHJcbiAgICAkKHdpbmRvdykuc2Nyb2xsVG8oJzBweCcsMTApXHJcbiAgICAkKCcjc2VhcmNoSWNvbicpLnNob3coKVxyXG4gICAgJCgnI2RhdGFDb250YWluZXInKS5mYWRlSW4oMzAwKVxyXG4gICAgJCgnI3NlYXJjaENvbnRhaW5lcicpLmhpZGUoKVxyXG4gICAgIyQod2luZG93KS5zY3JvbGxUbygnI3BCYWNrVG9TZWFyY2gnLDYwMClcclxuXHJcblxyXG5cclxuXHJcbiNnb3Zfc2VsZWN0b3IgPSBuZXcgR292U2VsZWN0b3IgJy50eXBlYWhlYWQnLCAnZGF0YS9oX3R5cGVzLmpzb24nLCA3XHJcbmdvdl9zZWxlY3RvciA9IG5ldyBHb3ZTZWxlY3RvciAnLnR5cGVhaGVhZCcsICdkYXRhL2hfdHlwZXNfY2EuanNvbicsIDdcclxuI2dvdl9zZWxlY3RvciA9IG5ldyBHb3ZTZWxlY3RvciAnLnR5cGVhaGVhZCcsICdodHRwOi8vNDYuMTAxLjMuNzkvcmVzdC9kYi9nb3ZzP2ZpbHRlcj1zdGF0ZT0lMjJDQSUyMiZhcHBfbmFtZT1nb3Z3aWtpJmZpZWxkcz1faWQsZ292X25hbWUsZ292X3R5cGUsc3RhdGUmbGltaXQ9NTAwMCcsIDdcclxudGVtcGxhdGVzID0gbmV3IFRlbXBsYXRlczJcclxuYWN0aXZlX3RhYj1cIlwiIFxyXG5cclxuI1wiXHJcblxyXG4jIGZpcmUgY2xpZW50LXNpZGUgVVJMIHJvdXRpbmdcclxucm91dGVyID0gbmV3IEdyYXBuZWxcclxucm91dGVyLmdldCAnOmlkJywgKHJlcSkgLT4gXHJcbiAgaWQgPSByZXEucGFyYW1zLmlkXHJcbiAgY29uc29sZS5sb2cgXCJST1VURVIgSUQ9I3tpZH1cIlxyXG4gIGdldF9lbGVjdGVkX29mZmljaWFscyA9IChnb3ZfaWQsIGxpbWl0LCBvbnN1Y2Nlc3MpIC0+XHJcbiAgICAkLmFqYXhcclxuICAgICAgdXJsOlwiaHR0cDovLzQ2LjEwMS4zLjc5OjgwL3Jlc3QvZGIvZWxlY3RlZF9vZmZpY2lhbHNcIlxyXG4gICAgICBkYXRhOlxyXG4gICAgICAgIGZpbHRlcjpcImdvdnNfaWQ9XCIgKyBnb3ZfaWRcclxuICAgICAgICBmaWVsZHM6XCJnb3ZzX2lkLHRpdGxlLGZ1bGxfbmFtZSxlbWFpbF9hZGRyZXNzLHBob3RvX3VybCx0ZXJtX2V4cGlyZXNcIlxyXG4gICAgICAgIGFwcF9uYW1lOlwiZ292d2lraVwiXHJcbiAgICAgICAgb3JkZXI6XCJkaXNwbGF5X29yZGVyXCJcclxuICAgICAgICBsaW1pdDpsaW1pdFxyXG5cclxuICAgICAgZGF0YVR5cGU6ICdqc29uJ1xyXG4gICAgICBjYWNoZTogdHJ1ZVxyXG4gICAgICBzdWNjZXNzOiBvbnN1Y2Nlc3NcclxuICAgICAgZXJyb3I6KGUpIC0+XHJcbiAgICAgICAgY29uc29sZS5sb2cgZVxyXG5cclxuICBlbGVjdGVkX29mZmljaWFscyA9IGdldF9lbGVjdGVkX29mZmljaWFscyBpZCwgMjUsIChlbGVjdGVkX29mZmljaWFsc19kYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikgLT5cclxuICAgIGRhdGEgPSBuZXcgT2JqZWN0KClcclxuICAgIGRhdGEuX2lkID0gaWRcclxuICAgIGRhdGEuZWxlY3RlZF9vZmZpY2lhbHMgPSBlbGVjdGVkX29mZmljaWFsc19kYXRhXHJcbiAgICBkYXRhLmdvdl9uYW1lID0gXCJcIlxyXG4gICAgZGF0YS5nb3ZfdHlwZSA9IFwiXCJcclxuICAgIGRhdGEuc3RhdGUgPSBcIlwiXHJcbiAgICAkKCcjZGV0YWlscycpLmh0bWwgdGVtcGxhdGVzLmdldF9odG1sKDAsIGRhdGEpXHJcbiAgICBnZXRfcmVjb3JkMiBkYXRhLl9pZFxyXG4gICAgYWN0aXZhdGVfdGFiKClcclxuICAgIEdPVldJS0kuc2hvd19kYXRhX3BhZ2UoKVxyXG4gICAgcmV0dXJuXHJcblxyXG5cclxuXHJcblxyXG53aW5kb3cucmVtZW1iZXJfdGFiID0obmFtZSktPiBhY3RpdmVfdGFiID0gbmFtZVxyXG5cclxuI3dpbmRvdy5nZW9jb2RlX2FkZHIgPSAoaW5wdXRfc2VsZWN0b3IpLT4gZ292bWFwLmdvY29kZV9hZGRyICQoaW5wdXRfc2VsZWN0b3IpLnZhbCgpXHJcblxyXG4kKGRvY3VtZW50KS5vbiAnY2xpY2snLCAnI2ZpZWxkVGFicyBhJywgKGUpIC0+XHJcbiAgYWN0aXZlX3RhYiA9ICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCd0YWJuYW1lJylcclxuICBjb25zb2xlLmxvZyBhY3RpdmVfdGFiXHJcbiAgJChcIiN0YWJzQ29udGVudCAudGFiLXBhbmVcIikucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIilcclxuICAkKCQoZS5jdXJyZW50VGFyZ2V0KS5hdHRyKCdocmVmJykpLmFkZENsYXNzKFwiYWN0aXZlXCIpXHJcbiAgdGVtcGxhdGVzLmFjdGl2YXRlIDAsIGFjdGl2ZV90YWJcclxuXHJcbiQoZG9jdW1lbnQpLnRvb2x0aXAoe3NlbGVjdG9yOiBcIltjbGFzcz0nbWVkaWEtdG9vbHRpcCddXCIsdHJpZ2dlcjonY2xpY2snfSlcclxuXHJcbmFjdGl2YXRlX3RhYiA9KCkgLT5cclxuICAkKFwiI2ZpZWxkVGFicyBhW2hyZWY9JyN0YWIje2FjdGl2ZV90YWJ9J11cIikudGFiKCdzaG93JylcclxuXHJcbmdvdl9zZWxlY3Rvci5vbl9zZWxlY3RlZCA9IChldnQsIGRhdGEsIG5hbWUpIC0+XHJcbiAgI3JlbmRlckRhdGEgJyNkZXRhaWxzJywgZGF0YVxyXG4gIGdldF9lbGVjdGVkX29mZmljaWFscyBkYXRhLl9pZCwgMjUsIChkYXRhMiwgdGV4dFN0YXR1cywganFYSFIpIC0+XHJcbiAgICBkYXRhLmVsZWN0ZWRfb2ZmaWNpYWxzID0gZGF0YTJcclxuICAgICQoJyNkZXRhaWxzJykuaHRtbCB0ZW1wbGF0ZXMuZ2V0X2h0bWwoMCwgZGF0YSlcclxuICAgICNnZXRfcmVjb3JkIFwiaW5jX2lkOiN7ZGF0YVtcImluY19pZFwiXX1cIlxyXG4gICAgZ2V0X3JlY29yZDIgZGF0YVtcIl9pZFwiXVxyXG4gICAgYWN0aXZhdGVfdGFiKClcclxuICAgIEdPVldJS0kuc2hvd19kYXRhX3BhZ2UoKVxyXG4gICAgcm91dGVyLm5hdmlnYXRlKGRhdGEuX2lkKVxyXG4gICAgcmV0dXJuXHJcblxyXG5cclxuZ2V0X3JlY29yZCA9IChxdWVyeSkgLT5cclxuICAkLmFqYXhcclxuICAgIHVybDogXCJodHRwczovL2FwaS5tb25nb2xhYi5jb20vYXBpLzEvZGF0YWJhc2VzL2dvdndpa2kvY29sbGVjdGlvbnMvZ292cy8/cT17I3txdWVyeX19JmY9e19pZDowfSZsPTEmYXBpS2V5PTBZNVhfUWsydU9KUmRISldKS1NSV2s2bDZKcVZUUzJ5XCJcclxuICAgIGRhdGFUeXBlOiAnanNvbidcclxuICAgIGNhY2hlOiB0cnVlXHJcbiAgICBzdWNjZXNzOiAoZGF0YSkgLT5cclxuICAgICAgaWYgZGF0YS5sZW5ndGhcclxuICAgICAgICAkKCcjZGV0YWlscycpLmh0bWwgdGVtcGxhdGVzLmdldF9odG1sKDAsIGRhdGFbMF0pXHJcbiAgICAgICAgYWN0aXZhdGVfdGFiKClcclxuICAgICAgICAjZ292bWFwLmdlb2NvZGUgZGF0YVswXVxyXG4gICAgICByZXR1cm5cclxuICAgIGVycm9yOihlKSAtPlxyXG4gICAgICBjb25zb2xlLmxvZyBlXHJcblxyXG5cclxuZ2V0X3JlY29yZDIgPSAocmVjaWQpIC0+XHJcbiAgJC5hamF4XHJcbiAgICAjdXJsOiBcImh0dHBzOi8vZHNwLWdvdndpa2kuY2xvdWQuZHJlYW1mYWN0b3J5LmNvbTo0NDMvcmVzdC9nb3Z3aWtpX2FwaS9nb3ZzLyN7cmVjaWR9XCJcclxuICAgIHVybDogXCJodHRwOi8vNDYuMTAxLjMuNzk6ODAvcmVzdC9kYi9nb3ZzLyN7cmVjaWR9XCJcclxuICAgIGRhdGFUeXBlOiAnanNvbidcclxuICAgIGhlYWRlcnM6IHtcIlgtRHJlYW1GYWN0b3J5LUFwcGxpY2F0aW9uLU5hbWVcIjpcImdvdndpa2lcIn1cclxuICAgIGNhY2hlOiB0cnVlXHJcbiAgICBzdWNjZXNzOiAoZGF0YSkgLT5cclxuICAgICAgaWYgZGF0YVxyXG4gICAgICAgIGdldF9maW5hbmNpYWxfc3RhdGVtZW50cyBkYXRhLl9pZCwgKGRhdGEyLCB0ZXh0U3RhdHVzLCBqcVhIUikgLT5cclxuICAgICAgICAgIGRhdGEuZmluYW5jaWFsX3N0YXRlbWVudHMgPSBkYXRhMlxyXG4gICAgICAgICAgZ2V0X2VsZWN0ZWRfb2ZmaWNpYWxzIGRhdGEuX2lkLCAyNSwgKGRhdGEzLCB0ZXh0U3RhdHVzMiwganFYSFIyKSAtPlxyXG4gICAgICAgICAgICBkYXRhLmVsZWN0ZWRfb2ZmaWNpYWxzID0gZGF0YTNcclxuICAgICAgICAgICAgJCgnI2RldGFpbHMnKS5odG1sIHRlbXBsYXRlcy5nZXRfaHRtbCgwLCBkYXRhKVxyXG4gICAgICAgICAgICBhY3RpdmF0ZV90YWIoKVxyXG4gICAgICAgICAgICAjZ292bWFwLmdlb2NvZGUgZGF0YVswXVxyXG4gICAgICByZXR1cm5cclxuICAgIGVycm9yOihlKSAtPlxyXG4gICAgICBjb25zb2xlLmxvZyBlXHJcblxyXG5cclxuZ2V0X2VsZWN0ZWRfb2ZmaWNpYWxzID0gKGdvdl9pZCwgbGltaXQsIG9uc3VjY2VzcykgLT5cclxuICAkLmFqYXhcclxuICAgIHVybDpcImh0dHA6Ly80Ni4xMDEuMy43OTo4MC9yZXN0L2RiL2VsZWN0ZWRfb2ZmaWNpYWxzXCJcclxuICAgIGRhdGE6XHJcbiAgICAgIGZpbHRlcjpcImdvdnNfaWQ9XCIgKyBnb3ZfaWRcclxuICAgICAgZmllbGRzOlwiZ292c19pZCx0aXRsZSxmdWxsX25hbWUsZW1haWxfYWRkcmVzcyxwaG90b191cmwsdGVybV9leHBpcmVzLHRlbGVwaG9uZV9udW1iZXJcIlxyXG4gICAgICBhcHBfbmFtZTpcImdvdndpa2lcIlxyXG4gICAgICBvcmRlcjpcImRpc3BsYXlfb3JkZXJcIlxyXG4gICAgICBsaW1pdDpsaW1pdFxyXG5cclxuICAgIGRhdGFUeXBlOiAnanNvbidcclxuICAgIGNhY2hlOiB0cnVlXHJcbiAgICBzdWNjZXNzOiBvbnN1Y2Nlc3NcclxuICAgIGVycm9yOihlKSAtPlxyXG4gICAgICBjb25zb2xlLmxvZyBlXHJcblxyXG5nZXRfZmluYW5jaWFsX3N0YXRlbWVudHMgPSAoZ292X2lkLCBvbnN1Y2Nlc3MpIC0+XHJcbiAgJC5hamF4XHJcbiAgICB1cmw6XCJodHRwOi8vNDYuMTAxLjMuNzk6ODAvcmVzdC9kYi9fcHJvYy9nZXRfZmluYW5jaWFsX3N0YXRlbWVudHNcIlxyXG4gICAgZGF0YTpcclxuICAgICAgYXBwX25hbWU6XCJnb3Z3aWtpXCJcclxuICAgICAgb3JkZXI6XCJjYXB0aW9uX2NhdGVnb3J5LGRpc3BsYXlfb3JkZXJcIlxyXG4gICAgICBwYXJhbXM6IFtcclxuICAgICAgICBuYW1lOiBcImdvdnNfaWRcIlxyXG4gICAgICAgIHBhcmFtX3R5cGU6IFwiSU5cIlxyXG4gICAgICAgIHZhbHVlOiBnb3ZfaWRcclxuICAgICAgXVxyXG5cclxuICAgIGRhdGFUeXBlOiAnanNvbidcclxuICAgIGNhY2hlOiB0cnVlXHJcbiAgICBzdWNjZXNzOiBvbnN1Y2Nlc3NcclxuICAgIGVycm9yOihlKSAtPlxyXG4gICAgICBjb25zb2xlLmxvZyBlXHJcbiAgXHJcblxyXG53aW5kb3cuR09WV0lLSS5zaG93X3JlY29yZCA9KHJlYyk9PlxyXG4gICQoJyNkZXRhaWxzJykuaHRtbCB0ZW1wbGF0ZXMuZ2V0X2h0bWwoMCwgcmVjKVxyXG4gIGFjdGl2YXRlX3RhYigpXHJcbiAgR09WV0lLSS5zaG93X2RhdGFfcGFnZSgpXHJcbiAgcm91dGVyLm5hdmlnYXRlKHJlYy5faWQpXHJcblxyXG5cclxud2luZG93LkdPVldJS0kuc2hvd19yZWNvcmQyID0ocmVjKT0+XHJcbiAgZ2V0X2VsZWN0ZWRfb2ZmaWNpYWxzIHJlYy5faWQsIDI1LCAoZGF0YSwgdGV4dFN0YXR1cywganFYSFIpIC0+XHJcbiAgICByZWMuZWxlY3RlZF9vZmZpY2lhbHMgPSBkYXRhXHJcbiAgICAkKCcjZGV0YWlscycpLmh0bWwgdGVtcGxhdGVzLmdldF9odG1sKDAsIHJlYylcclxuICAgIGdldF9yZWNvcmQyIHJlYy5faWRcclxuICAgIGFjdGl2YXRlX3RhYigpXHJcbiAgICBHT1ZXSUtJLnNob3dfZGF0YV9wYWdlKClcclxuICAgIHJvdXRlci5uYXZpZ2F0ZShyZWMuX2lkKVxyXG5cclxuXHJcblxyXG4jIyNcclxud2luZG93LnNob3dfcmVjID0gKHJlYyktPlxyXG4gICQoJyNkZXRhaWxzJykuaHRtbCB0ZW1wbGF0ZXMuZ2V0X2h0bWwoMCwgcmVjKVxyXG4gIGFjdGl2YXRlX3RhYigpXHJcbiMjI1xyXG5cclxuYnVpbGRfc2VsZWN0b3IgPSAoY29udGFpbmVyLCB0ZXh0LCBjb21tYW5kLCB3aGVyZV90b19zdG9yZV92YWx1ZSApIC0+XHJcbiAgJC5hamF4XHJcbiAgICB1cmw6ICdodHRwczovL2FwaS5tb25nb2xhYi5jb20vYXBpLzEvZGF0YWJhc2VzL2dvdndpa2kvcnVuQ29tbWFuZD9hcGlLZXk9MFk1WF9RazJ1T0pSZEhKV0pLU1JXazZsNkpxVlRTMnknXHJcbiAgICB0eXBlOiAnUE9TVCdcclxuICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb25cIlxyXG4gICAgZGF0YVR5cGU6ICdqc29uJ1xyXG4gICAgZGF0YTogY29tbWFuZCAjSlNPTi5zdHJpbmdpZnkoY29tbWFuZClcclxuICAgIGNhY2hlOiB0cnVlXHJcbiAgICBzdWNjZXNzOiAoZGF0YSkgPT5cclxuICAgICAgI2E9JC5leHRlbmQgdHJ1ZSBbXSxkYXRhXHJcbiAgICAgIHZhbHVlcz1kYXRhLnZhbHVlc1xyXG4gICAgICBidWlsZF9zZWxlY3RfZWxlbWVudCBjb250YWluZXIsIHRleHQsIHZhbHVlcy5zb3J0KCksIHdoZXJlX3RvX3N0b3JlX3ZhbHVlXHJcbiAgICAgIHJldHVyblxyXG4gICAgZXJyb3I6KGUpIC0+XHJcbiAgICAgIGNvbnNvbGUubG9nIGVcclxuXHJcblxyXG5idWlsZF9zZWxlY3RfZWxlbWVudCA9IChjb250YWluZXIsIHRleHQsIGFyciwgd2hlcmVfdG9fc3RvcmVfdmFsdWUgKSAtPlxyXG4gIHMgID0gXCI8c2VsZWN0IGNsYXNzPSdmb3JtLWNvbnRyb2wnIHN0eWxlPSdtYXh3aWR0aDoxNjBweDsnPjxvcHRpb24gdmFsdWU9Jyc+I3t0ZXh0fTwvb3B0aW9uPlwiXHJcbiAgcyArPSBcIjxvcHRpb24gdmFsdWU9JyN7dn0nPiN7dn08L29wdGlvbj5cIiBmb3IgdiBpbiBhcnIgd2hlbiB2XHJcbiAgcyArPSBcIjwvc2VsZWN0PlwiXHJcbiAgc2VsZWN0ID0gJChzKVxyXG4gICQoY29udGFpbmVyKS5hcHBlbmQoc2VsZWN0KVxyXG4gIFxyXG4gICMgc2V0IGRlZmF1bHQgJ0NBJ1xyXG4gIGlmIHRleHQgaXMgJ1N0YXRlLi4nXHJcbiAgICBzZWxlY3QudmFsICdDQSdcclxuICAgIHdpbmRvdy5HT1ZXSUtJLnN0YXRlX2ZpbHRlcj0nQ0EnXHJcbiAgICBnb3ZtYXAub25fYm91bmRzX2NoYW5nZWRfbGF0ZXIoKVxyXG5cclxuICBzZWxlY3QuY2hhbmdlIChlKSAtPlxyXG4gICAgZWwgPSAkKGUudGFyZ2V0KVxyXG4gICAgd2luZG93LkdPVldJS0lbd2hlcmVfdG9fc3RvcmVfdmFsdWVdID0gZWwudmFsKClcclxuICAgICQoJy5nb3YtY291bnRlcicpLnRleHQgZ292X3NlbGVjdG9yLmNvdW50X2dvdnMoKVxyXG4gICAgZ292bWFwLm9uX2JvdW5kc19jaGFuZ2VkKClcclxuXHJcblxyXG5hZGp1c3RfdHlwZWFoZWFkX3dpZHRoID0oKSAtPlxyXG4gIGlucCA9ICQoJyNteWlucHV0JylcclxuICBwYXIgPSAkKCcjdHlwZWFoZWQtY29udGFpbmVyJylcclxuICBpbnAud2lkdGggcGFyLndpZHRoKClcclxuXHJcblxyXG5cclxuXHJcbnN0YXJ0X2FkanVzdGluZ190eXBlYWhlYWRfd2lkdGggPSgpIC0+XHJcbiAgJCh3aW5kb3cpLnJlc2l6ZSAtPlxyXG4gICAgYWRqdXN0X3R5cGVhaGVhZF93aWR0aCgpXHJcblxyXG5cclxuIyBhZGQgbGl2ZSByZWxvYWQgdG8gdGhlIHNpdGUuIEZvciBkZXZlbG9wbWVudCBvbmx5LlxyXG5saXZlcmVsb2FkID0gKHBvcnQpIC0+XHJcbiAgdXJsPXdpbmRvdy5sb2NhdGlvbi5vcmlnaW4ucmVwbGFjZSAvOlteOl0qJC8sIFwiXCJcclxuICAkLmdldFNjcmlwdCB1cmwgKyBcIjpcIiArIHBvcnQsID0+XHJcbiAgICAkKCdib2R5JykuYXBwZW5kIFwiXCJcIlxyXG4gICAgPGRpdiBzdHlsZT0ncG9zaXRpb246YWJzb2x1dGU7ei1pbmRleDoxMDAwO1xyXG4gICAgd2lkdGg6MTAwJTsgdG9wOjA7Y29sb3I6cmVkOyB0ZXh0LWFsaWduOiBjZW50ZXI7IFxyXG4gICAgcGFkZGluZzoxcHg7Zm9udC1zaXplOjEwcHg7bGluZS1oZWlnaHQ6MSc+bGl2ZTwvZGl2PlxyXG4gICAgXCJcIlwiXHJcblxyXG5mb2N1c19zZWFyY2hfZmllbGQgPSAobXNlYykgLT5cclxuICBzZXRUaW1lb3V0ICgtPiAkKCcjbXlpbnB1dCcpLmZvY3VzKCkpICxtc2VjXHJcblxyXG5cclxuICBcclxuIyBxdWljayBhbmQgZGlydHkgZml4IGZvciBiYWNrIGJ1dHRvbiBpbiBicm93c2VyXHJcbndpbmRvdy5vbmhhc2hjaGFuZ2UgPSAoZSkgLT5cclxuICBoPXdpbmRvdy5sb2NhdGlvbi5oYXNoXHJcbiAgI2NvbnNvbGUubG9nIFwib25IYXNoQ2hhbmdlICN7aH1cIlxyXG4gICNjb25zb2xlLmxvZyBlXHJcbiAgaWYgbm90IGhcclxuICAgIEdPVldJS0kuc2hvd19zZWFyY2hfcGFnZSgpXHJcblxyXG4jID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5cclxuI3RlbXBsYXRlcy5sb2FkX3RlbXBsYXRlIFwidGFic1wiLCBcImNvbmZpZy90YWJsYXlvdXQuanNvblwiXHJcbnRlbXBsYXRlcy5sb2FkX2Z1c2lvbl90ZW1wbGF0ZSBcInRhYnNcIiwgXCJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9mdXNpb250YWJsZXMvdjIvcXVlcnk/c3FsPVNFTEVDVCUyMColMjBGUk9NJTIwMXoyb1hRRVlRM3AyT29NSThWNWdLZ0hXQjVUejk5MEJyUTF4YzF0Vm8ma2V5PUFJemFTeUNYRFF5TURwR0EyZzNRanV2NENEdjd6UmotaXg0SVFKQVwiXHJcblxyXG5idWlsZF9zZWxlY3RvcignLnN0YXRlLWNvbnRhaW5lcicgLCAnU3RhdGUuLicgLCAne1wiZGlzdGluY3RcIjogXCJnb3ZzXCIsXCJrZXlcIjpcInN0YXRlXCJ9JyAsICdzdGF0ZV9maWx0ZXInKVxyXG5idWlsZF9zZWxlY3RvcignLmdvdi10eXBlLWNvbnRhaW5lcicgLCAndHlwZSBvZiBnb3Zlcm5tZW50Li4nICwgJ3tcImRpc3RpbmN0XCI6IFwiZ292c1wiLFwia2V5XCI6XCJnb3ZfdHlwZVwifScgLCAnZ292X3R5cGVfZmlsdGVyJylcclxuXHJcbmFkanVzdF90eXBlYWhlYWRfd2lkdGgoKVxyXG5zdGFydF9hZGp1c3RpbmdfdHlwZWFoZWFkX3dpZHRoKClcclxuXHJcbiQoJyNidG5CYWNrVG9TZWFyY2gnKS5jbGljayAoZSktPlxyXG4gIGUucHJldmVudERlZmF1bHQoKVxyXG4gIEdPVldJS0kuc2hvd19zZWFyY2hfcGFnZSgpXHJcblxyXG4jZm9jdXNfc2VhcmNoX2ZpZWxkIDUwMFxyXG5cclxuICBcclxuXHJcbmxpdmVyZWxvYWQgXCI5MDkwXCJcclxuXHJcbiIsIlxyXG5cclxuXHJcbiMgVGFrZXMgYW4gYXJyYXkgb2YgZG9jcyB0byBzZWFyY2ggaW4uXHJcbiMgUmV0dXJucyBhIGZ1bmN0aW9ucyB0aGF0IHRha2VzIDIgcGFyYW1zIFxyXG4jIHEgLSBxdWVyeSBzdHJpbmcgYW5kIFxyXG4jIGNiIC0gY2FsbGJhY2sgdGhhdCB3aWxsIGJlIGNhbGxlZCB3aGVuIHRoZSBzZWFyY2ggaXMgZG9uZS5cclxuIyBjYiByZXR1cm5zIGFuIGFycmF5IG9mIG1hdGNoaW5nIGRvY3VtZW50cy5cclxuIyBtdW1faXRlbXMgLSBtYXggbnVtYmVyIG9mIGZvdW5kIGl0ZW1zIHRvIHNob3dcclxuUXVlcnlNYXRoZXIgPSAoZG9jcywgbnVtX2l0ZW1zPTUpIC0+XHJcbiAgKHEsIGNiKSAtPlxyXG4gICAgdGVzdF9zdHJpbmcgPShzLCByZWdzKSAtPlxyXG4gICAgICAoaWYgbm90IHIudGVzdChzKSB0aGVuIHJldHVybiBmYWxzZSkgIGZvciByIGluIHJlZ3NcclxuICAgICAgcmV0dXJuIHRydWVcclxuXHJcbiAgICBbd29yZHMscmVnc10gPSBnZXRfd29yZHNfcmVncyBxXHJcbiAgICBtYXRjaGVzID0gW11cclxuICAgICMgaXRlcmF0ZSB0aHJvdWdoIHRoZSBwb29sIG9mIGRvY3MgYW5kIGZvciBhbnkgc3RyaW5nIHRoYXRcclxuICAgICMgY29udGFpbnMgdGhlIHN1YnN0cmluZyBgcWAsIGFkZCBpdCB0byB0aGUgYG1hdGNoZXNgIGFycmF5XHJcblxyXG4gICAgZm9yIGQgaW4gZG9jc1xyXG4gICAgICBpZiBtYXRjaGVzLmxlbmd0aCA+PSBudW1faXRlbXMgdGhlbiBicmVha1xyXG4gICAgICBpZiBHT1ZXSUtJLnN0YXRlX2ZpbHRlciBhbmQgZC5zdGF0ZSBpc250IEdPVldJS0kuc3RhdGVfZmlsdGVyIHRoZW4gY29udGludWVcclxuICAgICAgaWYgR09WV0lLSS5nb3ZfdHlwZV9maWx0ZXIgYW5kIGQuZ292X3R5cGUgaXNudCBHT1ZXSUtJLmdvdl90eXBlX2ZpbHRlciB0aGVuIGNvbnRpbnVlXHJcblxyXG4gICAgICBpZiB0ZXN0X3N0cmluZyhkLmdvdl9uYW1lLCByZWdzKSBcclxuICAgICAgICBtYXRjaGVzLnB1c2ggJC5leHRlbmQoe30sIGQpXHJcbiAgICAgICNpZiB0ZXN0X3N0cmluZyhcIiN7ZC5nb3ZfbmFtZX0gI3tkLnN0YXRlfSAje2QuZ292X3R5cGV9ICN7ZC5pbmNfaWR9XCIsIHJlZ3MpIHRoZW4gbWF0Y2hlcy5wdXNoICQuZXh0ZW5kKHt9LCBkKVxyXG4gICAgXHJcbiAgICBzZWxlY3RfdGV4dCBtYXRjaGVzLCB3b3JkcywgcmVnc1xyXG4gICAgY2IgbWF0Y2hlc1xyXG4gICAgcmV0dXJuXHJcbiBcclxuXHJcbiMgaW5zZXJ0cyA8c3Ryb25nPiBlbGVtZW50c2UgaW4gYXJyYXlcclxuc2VsZWN0X3RleHQgPSAoY2xvbmVzLHdvcmRzLHJlZ3MpIC0+XHJcbiAgZm9yIGQgaW4gY2xvbmVzXHJcbiAgICBkLmdvdl9uYW1lPXN0cm9uZ2lmeShkLmdvdl9uYW1lLCB3b3JkcywgcmVncylcclxuICAgICNkLnN0YXRlPXN0cm9uZ2lmeShkLnN0YXRlLCB3b3JkcywgcmVncylcclxuICAgICNkLmdvdl90eXBlPXN0cm9uZ2lmeShkLmdvdl90eXBlLCB3b3JkcywgcmVncylcclxuICBcclxuICByZXR1cm4gY2xvbmVzXHJcblxyXG5cclxuXHJcbiMgaW5zZXJ0cyA8c3Ryb25nPiBlbGVtZW50c2Vcclxuc3Ryb25naWZ5ID0gKHMsIHdvcmRzLCByZWdzKSAtPlxyXG4gIHJlZ3MuZm9yRWFjaCAocixpKSAtPlxyXG4gICAgcyA9IHMucmVwbGFjZSByLCBcIjxiPiN7d29yZHNbaV19PC9iPlwiXHJcbiAgcmV0dXJuIHNcclxuXHJcbiMgcmVtb3ZlcyA8PiB0YWdzIGZyb20gYSBzdHJpbmdcclxuc3RyaXAgPSAocykgLT5cclxuICBzLnJlcGxhY2UoLzxbXjw+XSo+L2csJycpXHJcblxyXG5cclxuIyBhbGwgdGlybXMgc3BhY2VzIGZyb20gYm90aCBzaWRlcyBhbmQgbWFrZSBjb250cmFjdHMgc2VxdWVuY2VzIG9mIHNwYWNlcyB0byAxXHJcbmZ1bGxfdHJpbSA9IChzKSAtPlxyXG4gIHNzPXMudHJpbSgnJytzKVxyXG4gIHNzPXNzLnJlcGxhY2UoLyArL2csJyAnKVxyXG5cclxuIyByZXR1cm5zIGFuIGFycmF5IG9mIHdvcmRzIGluIGEgc3RyaW5nXHJcbmdldF93b3JkcyA9IChzdHIpIC0+XHJcbiAgZnVsbF90cmltKHN0cikuc3BsaXQoJyAnKVxyXG5cclxuXHJcbmdldF93b3Jkc19yZWdzID0gKHN0cikgLT5cclxuICB3b3JkcyA9IGdldF93b3JkcyBzdHJcclxuICByZWdzID0gd29yZHMubWFwICh3KS0+IG5ldyBSZWdFeHAoXCIje3d9XCIsJ2knKVxyXG4gIFt3b3JkcyxyZWdzXVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUXVlcnlNYXRoZXJcclxuXHJcbiIsIlxyXG4jIyNcclxuIyBmaWxlOiB0ZW1wbGF0ZXMyLmNvZmZlZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiNcclxuIyBDbGFzcyB0byBtYW5hZ2UgdGVtcGxhdGVzIGFuZCByZW5kZXIgZGF0YSBvbiBodG1sIHBhZ2UuXHJcbiNcclxuIyBUaGUgbWFpbiBtZXRob2QgOiByZW5kZXIoZGF0YSksIGdldF9odG1sKGRhdGEpXHJcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiMjI1xyXG5cclxuXHJcblxyXG4jIExPQUQgRklFTEQgTkFNRVNcclxuZmllbGROYW1lcyA9IHt9XHJcbmZpZWxkTmFtZXNIZWxwID0ge31cclxuXHJcblxyXG5yZW5kZXJfZmllbGRfdmFsdWUgPSAobixtYXNrLGRhdGEpIC0+XHJcbiAgdj1kYXRhW25dXHJcbiAgaWYgbm90IGRhdGFbbl1cclxuICAgIHJldHVybiAnJ1xyXG5cclxuICBpZiBuID09IFwid2ViX3NpdGVcIlxyXG4gICAgcmV0dXJuIFwiPGEgdGFyZ2V0PSdfYmxhbmsnIGhyZWY9JyN7dn0nPiN7dn08L2E+XCJcclxuICBlbHNlXHJcbiAgICBpZiAnJyAhPSBtYXNrXHJcbiAgICAgIHJldHVybiBudW1lcmFsKHYpLmZvcm1hdChtYXNrKVxyXG4gICAgZWxzZVxyXG4gICAgICBpZiB2Lmxlbmd0aCA+IDIwIGFuZFxyXG4gICAgICBuID09IFwib3Blbl9lbnJvbGxtZW50X3NjaG9vbHNcIlxyXG4gICAgICB0aGVuIHYgPSB2LnN1YnN0cmluZygwLCAxOSkgKyBcIjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO2NvbG9yOiMwNzRkNzEnICB0aXRsZT0nI3t2fSc+JmhlbGxpcDs8L2Rpdj5cIlxyXG4gICAgICBlbHNlXHJcbiAgICAgICAgcmV0dXJuIHZcclxuXHJcblxyXG5yZW5kZXJfZmllbGRfbmFtZV9oZWxwID0gKGZOYW1lKSAtPlxyXG4gICNpZiBmaWVsZE5hbWVzSGVscFtmTmFtZV1cclxuICAgIHJldHVybiBmaWVsZE5hbWVzSGVscFtmTmFtZV1cclxuXHJcbnJlbmRlcl9maWVsZF9uYW1lID0gKGZOYW1lKSAtPlxyXG4gIGlmIGZpZWxkTmFtZXNbZk5hbWVdP1xyXG4gICAgcmV0dXJuIGZpZWxkTmFtZXNbZk5hbWVdXHJcblxyXG4gIHMgPSBmTmFtZS5yZXBsYWNlKC9fL2csXCIgXCIpXHJcbiAgcyA9IHMuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzLnN1YnN0cmluZygxKVxyXG4gIHJldHVybiBzXHJcblxyXG5cclxucmVuZGVyX2ZpZWxkID0gKGZOYW1lLGRhdGEpLT5cclxuICBpZiBcIl9cIiA9PSBzdWJzdHIgZk5hbWUsIDAsIDFcclxuICAgIFwiXCJcIlxyXG4gICAgPGRpdj5cclxuICAgICAgICA8c3BhbiBjbGFzcz0nZi1uYW0nPiN7cmVuZGVyX2ZpZWxkX25hbWUgZk5hbWV9PC9zcGFuPlxyXG4gICAgICAgIDxzcGFuIGNsYXNzPSdmLXZhbCc+Jm5ic3A7PC9zcGFuPlxyXG4gICAgPC9kaXY+XHJcbiAgICBcIlwiXCJcclxuICBlbHNlXHJcbiAgICByZXR1cm4gJycgdW5sZXNzIGZWYWx1ZSA9IGRhdGFbZk5hbWVdXHJcbiAgICBcIlwiXCJcclxuICAgIDxkaXY+XHJcbiAgICAgICAgPHNwYW4gY2xhc3M9J2YtbmFtJz4je3JlbmRlcl9maWVsZF9uYW1lIGZOYW1lfTxkaXY+PC9zcGFuPlxyXG4gICAgICAgIDxzcGFuIGNsYXNzPSdmLXZhbCc+I3tyZW5kZXJfZmllbGRfdmFsdWUoZk5hbWUsZGF0YSl9PC9zcGFuPlxyXG4gICAgPC9kaXY+XHJcbiAgICBcIlwiXCJcclxuXHJcbnJlbmRlcl9zdWJoZWFkaW5nID0gKGZOYW1lLCBtYXNrLCBub3RGaXJzdCktPlxyXG4gIHMgPSAnJ1xyXG4gIGZOYW1lID0gcmVuZGVyX2ZpZWxkX25hbWUgZk5hbWVcclxuICBpZiBtYXNrID09IFwiaGVhZGluZ1wiXHJcbiAgICBpZiBub3RGaXJzdCAhPSAwXHJcbiAgICAgIHMgKz0gXCI8YnIvPlwiXHJcbiAgICBzICs9IFwiPGRpdj48c3BhbiBjbGFzcz0nZi1uYW0nPiN7Zk5hbWV9PC9zcGFuPjxzcGFuIGNsYXNzPSdmLXZhbCc+IDwvc3Bhbj48L2Rpdj5cIlxyXG4gIHJldHVybiBzXHJcblxyXG5yZW5kZXJfZmllbGRzID0gKGZpZWxkcyxkYXRhLHRlbXBsYXRlKS0+XHJcbiAgaCA9ICcnXHJcbiAgZm9yIGZpZWxkLGkgaW4gZmllbGRzXHJcbiAgICBpZiAodHlwZW9mIGZpZWxkIGlzIFwib2JqZWN0XCIpXHJcbiAgICAgIGlmIGZpZWxkLm1hc2sgPT0gXCJoZWFkaW5nXCJcclxuICAgICAgICBoICs9IHJlbmRlcl9zdWJoZWFkaW5nKGZpZWxkLm5hbWUsIGZpZWxkLm1hc2ssIGkpXHJcbiAgICAgICAgZlZhbHVlID0gJydcclxuICAgICAgZWxzZVxyXG4gICAgICAgIGZWYWx1ZSA9IHJlbmRlcl9maWVsZF92YWx1ZSBmaWVsZC5uYW1lLCBmaWVsZC5tYXNrLCBkYXRhXHJcbiAgICAgICAgaWYgKCcnICE9IGZWYWx1ZSBhbmQgZlZhbHVlICE9ICcwJylcclxuICAgICAgICAgIGZOYW1lID0gcmVuZGVyX2ZpZWxkX25hbWUgZmllbGQubmFtZVxyXG4gICAgICAgICAgZk5hbWVIZWxwID0gcmVuZGVyX2ZpZWxkX25hbWVfaGVscCBmaWVsZC5uYW1lXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgZlZhbHVlID0gJydcclxuXHJcbiAgICBlbHNlXHJcbiAgICAgIGZWYWx1ZSA9IHJlbmRlcl9maWVsZF92YWx1ZSBmaWVsZCwgJycsIGRhdGFcclxuICAgICAgaWYgKCcnICE9IGZWYWx1ZSlcclxuICAgICAgICBmTmFtZSA9IHJlbmRlcl9maWVsZF9uYW1lIGZpZWxkXHJcbiAgICAgICAgZk5hbWVIZWxwID0gcmVuZGVyX2ZpZWxkX25hbWVfaGVscCBmTmFtZVxyXG4gICAgaWYgKCcnICE9IGZWYWx1ZSlcclxuICAgICAgaCArPSB0ZW1wbGF0ZShuYW1lOiBmTmFtZSwgdmFsdWU6IGZWYWx1ZSwgaGVscDogZk5hbWVIZWxwKVxyXG4gIHJldHVybiBoXHJcblxyXG5yZW5kZXJfZmluYW5jaWFsX2ZpZWxkcyA9IChkYXRhLHRlbXBsYXRlKS0+XHJcbiAgaCA9ICcnXHJcbiAgbWFzayA9ICcwLDAnXHJcbiAgY2F0ZWdvcnkgPSAnJ1xyXG4gIGZvciBmaWVsZCBpbiBkYXRhXHJcbiAgICBpZiBjYXRlZ29yeSAhPSBmaWVsZC5jYXRlZ29yeV9uYW1lXHJcbiAgICAgIGNhdGVnb3J5ID0gZmllbGQuY2F0ZWdvcnlfbmFtZVxyXG4gICAgICBpZiBjYXRlZ29yeSA9PSAnT3ZlcnZpZXcnXHJcbiAgICAgICAgaCArPSB0ZW1wbGF0ZShuYW1lOiBcIjxiPlwiICsgY2F0ZWdvcnkgKyBcIjwvYj5cIiwgZ2VuZnVuZDogJycsIG90aGVyZnVuZHM6ICcnLCB0b3RhbGZ1bmRzOiAnJylcclxuICAgICAgZWxzZSBpZiBjYXRlZ29yeSA9PSAnUmV2ZW51ZXMnXHJcbiAgICAgICAgaCArPSAnPC9icj4nXHJcbiAgICAgICAgaCArPSBcIjxiPlwiICsgdGVtcGxhdGUobmFtZTogY2F0ZWdvcnksIGdlbmZ1bmQ6IFwiR2VuZXJhbCBGdW5kXCIsIG90aGVyZnVuZHM6IFwiT3RoZXIgRnVuZHNcIiwgdG90YWxmdW5kczogXCJUb3RhbCBHb3YuIEZ1bmRzXCIpICsgXCI8L2I+XCJcclxuICAgICAgZWxzZVxyXG4gICAgICAgIGggKz0gJzwvYnI+J1xyXG4gICAgICAgIGggKz0gdGVtcGxhdGUobmFtZTogXCI8Yj5cIiArIGNhdGVnb3J5ICsgXCI8L2I+XCIsIGdlbmZ1bmQ6ICcnLCBvdGhlcmZ1bmRzOiAnJywgdG90YWxmdW5kczogJycpXHJcblxyXG4gICAgZmllbGRzX3dpdGhfZG9sbGFyX3NpZ24gPSBbJ1RheGVzJywgJ0NhcGl0YWwgb3V0bGF5JywgJ1RvdGFsIFJldmVudWVzJywgJ1RvdGFsIEV4cGVuZGl0dXJlcycsICdTdXJwbHVzIC8gKERlZmljaXQpJ11cclxuICAgIGlmIGZpZWxkLmNhcHRpb24gPT0gJ0dlbmVyYWwgRnVuZCBCYWxhbmNlJyBvciBmaWVsZC5jYXB0aW9uID09ICdMb25nIFRlcm0gRGVidCdcclxuICAgICAgaCArPSB0ZW1wbGF0ZShuYW1lOiBmaWVsZC5jYXB0aW9uLCBnZW5mdW5kOiBjdXJyZW5jeShmaWVsZC5nZW5mdW5kLCBtYXNrLCAnPHNwYW4gY2xhc3M9XCJjdXJyZW5jeS1zaWduXCI+JDwvc3Bhbj4nKSlcclxuICAgIGVsc2UgaWYgZmllbGQuY2FwdGlvbiBpbiBmaWVsZHNfd2l0aF9kb2xsYXJfc2lnblxyXG4gICAgICBoICs9IHRlbXBsYXRlKG5hbWU6IGZpZWxkLmNhcHRpb24sIGdlbmZ1bmQ6IGN1cnJlbmN5KGZpZWxkLmdlbmZ1bmQsIG1hc2ssICc8c3BhbiBjbGFzcz1cImN1cnJlbmN5LXNpZ25cIj4kPC9zcGFuPicpLCBvdGhlcmZ1bmRzOiBjdXJyZW5jeShmaWVsZC5vdGhlcmZ1bmRzLCBtYXNrLCAnPHNwYW4gY2xhc3M9XCJjdXJyZW5jeS1zaWduXCI+JDwvc3Bhbj4nKSwgdG90YWxmdW5kczogY3VycmVuY3koZmllbGQudG90YWxmdW5kcywgbWFzaywgJzxzcGFuIGNsYXNzPVwiY3VycmVuY3ktc2lnblwiPiQ8L3NwYW4+JykpXHJcbiAgICBlbHNlXHJcbiAgICAgIGggKz0gdGVtcGxhdGUobmFtZTogZmllbGQuY2FwdGlvbiwgZ2VuZnVuZDogY3VycmVuY3koZmllbGQuZ2VuZnVuZCwgbWFzayksIG90aGVyZnVuZHM6IGN1cnJlbmN5KGZpZWxkLm90aGVyZnVuZHMsIG1hc2spLCB0b3RhbGZ1bmRzOiBjdXJyZW5jeShmaWVsZC50b3RhbGZ1bmRzLCBtYXNrKSlcclxuICByZXR1cm4gaFxyXG5cclxudW5kZXIgPSAocykgLT4gcy5yZXBsYWNlKC9bXFxzXFwrXFwtXS9nLCAnXycpXHJcblxyXG50b1RpdGxlQ2FzZSA9IChzdHIpIC0+XHJcbiAgc3RyLnJlcGxhY2UgL1xcd1xcUyovZywgKHR4dCkgLT5cclxuICAgIHR4dC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHR4dC5zdWJzdHIoMSkudG9Mb3dlckNhc2UoKVxyXG5cclxuY3VycmVuY3kgPSAobiwgbWFzaywgc2lnbiA9ICcnKSAtPlxyXG4gIG4gPSBudW1lcmFsKG4pXHJcbiAgaWYgbiA8IDBcclxuICAgIHMgPSBuLmZvcm1hdChtYXNrKS50b1N0cmluZygpXHJcbiAgICBzID0gcy5yZXBsYWNlKC8tL2csICcnKVxyXG4gICAgcmV0dXJuIFwiKCN7c2lnbn0je3N9KVwiXHJcblxyXG4gIG4gPSBuLmZvcm1hdChtYXNrKVxyXG4gIHJldHVybiBcIiN7c2lnbn0je259XCJcclxuXHJcbnJlbmRlcl90YWJzID0gKGluaXRpYWxfbGF5b3V0LCBkYXRhLCB0YWJzZXQsIHBhcmVudCkgLT5cclxuICAjbGF5b3V0ID0gYWRkX290aGVyX3RhYl90b19sYXlvdXQgaW5pdGlhbF9sYXlvdXQsIGRhdGFcclxuICBsYXlvdXQgPSBpbml0aWFsX2xheW91dFxyXG4gIHRlbXBsYXRlcyA9IHBhcmVudC50ZW1wbGF0ZXNcclxuICBwbG90X2hhbmRsZXMgPSB7fVxyXG5cclxuICBsYXlvdXRfZGF0YSA9XHJcbiAgICB0aXRsZTogZGF0YS5nb3ZfbmFtZVxyXG4gICAgd2lraXBlZGlhX3BhZ2VfZXhpc3RzOiBkYXRhLndpa2lwZWRpYV9wYWdlX2V4aXN0c1xyXG4gICAgd2lraXBlZGlhX3BhZ2VfbmFtZTogIGRhdGEud2lraXBlZGlhX3BhZ2VfbmFtZVxyXG4gICAgdHJhbnNwYXJlbnRfY2FsaWZvcm5pYV9wYWdlX25hbWU6IGRhdGEudHJhbnNwYXJlbnRfY2FsaWZvcm5pYV9wYWdlX25hbWVcclxuICAgIGxhdGVzdF9hdWRpdF91cmw6IGRhdGEubGF0ZXN0X2F1ZGl0X3VybFxyXG4gICAgdGFiczogW11cclxuICAgIHRhYmNvbnRlbnQ6ICcnXHJcblxyXG4gIGZvciB0YWIsaSBpbiBsYXlvdXRcclxuICAgIGxheW91dF9kYXRhLnRhYnMucHVzaFxyXG4gICAgICB0YWJpZDogdW5kZXIodGFiLm5hbWUpLFxyXG4gICAgICB0YWJuYW1lOiB0YWIubmFtZSxcclxuICAgICAgYWN0aXZlOiAoaWYgaT4wIHRoZW4gJycgZWxzZSAnYWN0aXZlJylcclxuXHJcbiAgZm9yIHRhYixpIGluIGxheW91dFxyXG4gICAgZGV0YWlsX2RhdGEgPVxyXG4gICAgICB0YWJpZDogdW5kZXIodGFiLm5hbWUpLFxyXG4gICAgICB0YWJuYW1lOiB0YWIubmFtZSxcclxuICAgICAgYWN0aXZlOiAoaWYgaT4wIHRoZW4gJycgZWxzZSAnYWN0aXZlJylcclxuICAgICAgdGFiY29udGVudDogJydcclxuICAgIHN3aXRjaCB0YWIubmFtZVxyXG4gICAgICB3aGVuICdPdmVydmlldyArIEVsZWN0ZWQgT2ZmaWNpYWxzJ1xyXG4gICAgICAgIGRldGFpbF9kYXRhLnRhYmNvbnRlbnQgKz0gcmVuZGVyX2ZpZWxkcyB0YWIuZmllbGRzLCBkYXRhLCB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC1uYW1ldmFsdWUtdGVtcGxhdGUnXVxyXG4gICAgICAgIGZvciBvZmZpY2lhbCxpIGluIGRhdGEuZWxlY3RlZF9vZmZpY2lhbHMucmVjb3JkXHJcbiAgICAgICAgICBvZmZpY2lhbF9kYXRhID1cclxuICAgICAgICAgICAgdGl0bGU6IGlmICcnICE9IG9mZmljaWFsLnRpdGxlIHRoZW4gXCJUaXRsZTogXCIgKyBvZmZpY2lhbC50aXRsZVxyXG4gICAgICAgICAgICBuYW1lOiBpZiAnJyAhPSBvZmZpY2lhbC5mdWxsX25hbWUgdGhlbiBcIk5hbWU6IFwiICsgb2ZmaWNpYWwuZnVsbF9uYW1lXHJcbiAgICAgICAgICAgIGVtYWlsOiBpZiBudWxsICE9IG9mZmljaWFsLmVtYWlsX2FkZHJlc3MgdGhlbiBcIkVtYWlsOiBcIiArIG9mZmljaWFsLmVtYWlsX2FkZHJlc3NcclxuICAgICAgICAgICAgdGVsZXBob25lbnVtYmVyOiBpZiBudWxsICE9IG9mZmljaWFsLnRlbGVwaG9uZV9udW1iZXIgYW5kIHVuZGVmaW5lZCAhPSBvZmZpY2lhbC50ZWxlcGhvbmVfbnVtYmVyIHRoZW4gXCJUZWxlcGhvbmUgTnVtYmVyOiBcIiArIG9mZmljaWFsLnRlbGVwaG9uZV9udW1iZXJcclxuICAgICAgICAgICAgdGVybWV4cGlyZXM6IGlmIG51bGwgIT0gb2ZmaWNpYWwudGVybV9leHBpcmVzIHRoZW4gXCJUZXJtIEV4cGlyZXM6IFwiICsgb2ZmaWNpYWwudGVybV9leHBpcmVzXHJcblxyXG4gICAgICAgICAgaWYgJycgIT0gb2ZmaWNpYWwucGhvdG9fdXJsIGFuZCBvZmZpY2lhbC5waG90b191cmwgIT0gbnVsbCB0aGVuIG9mZmljaWFsX2RhdGEuaW1hZ2UgPSAgJzxpbWcgc3JjPVwiJytvZmZpY2lhbC5waG90b191cmwrJ1wiIGNsYXNzPVwicG9ydHJhaXRcIiBhbHQ9XCJcIiAvPidcclxuICAgICAgICAgIGRldGFpbF9kYXRhLnRhYmNvbnRlbnQgKz0gdGVtcGxhdGVzWyd0YWJkZXRhaWwtb2ZmaWNpYWwtdGVtcGxhdGUnXShvZmZpY2lhbF9kYXRhKVxyXG4gICAgICB3aGVuICdFbXBsb3llZSBDb21wZW5zYXRpb24nXHJcbiAgICAgICAgaCA9ICcnXHJcbiAgICAgICAgaCArPSByZW5kZXJfZmllbGRzIHRhYi5maWVsZHMsIGRhdGEsIHRlbXBsYXRlc1sndGFiZGV0YWlsLW5hbWV2YWx1ZS10ZW1wbGF0ZSddXHJcbiAgICAgICAgZGV0YWlsX2RhdGEudGFiY29udGVudCArPSB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC1lbXBsb3llZS1jb21wLXRlbXBsYXRlJ10oY29udGVudDogaClcclxuICAgICAgICBpZiBub3QgcGxvdF9oYW5kbGVzWydtZWRpYW4tY29tcC1ncmFwaCddXHJcbiAgICAgICAgICBkcmF3Q2hhcnQgPSAoKSAtPlxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0ICggLT5cclxuICAgICAgICAgICAgICB2aXNfZGF0YSA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5EYXRhVGFibGUoKVxyXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnc3RyaW5nJywgJ01lZGlhbiBDb21wZW5zYXRpb24nXHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdudW1iZXInLCAnV2FnZXMnXHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdudW1iZXInLCAnQmVucy4nXHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkUm93cyBbXHJcbiAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgIHRvVGl0bGVDYXNlIGRhdGEuZ292X25hbWUgKyAnXFxuIEVtcGxveWVlcydcclxuICAgICAgICAgICAgICAgICAgZGF0YVsnbWVkaWFuX3NhbGFyeV9wZXJfZnVsbF90aW1lX2VtcCddXHJcbiAgICAgICAgICAgICAgICAgIGRhdGFbJ21lZGlhbl9iZW5lZml0c19wZXJfZnRfZW1wJ11cclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgJ0FsbCBcXG4nICsgdG9UaXRsZUNhc2UgZGF0YS5nb3ZfbmFtZSArICcgXFxuIFJlc2lkZW50cydcclxuICAgICAgICAgICAgICAgICAgZGF0YVsnbWVkaWFuX3dhZ2VzX2dlbmVyYWxfcHVibGljJ11cclxuICAgICAgICAgICAgICAgICAgZGF0YVsnbWVkaWFuX2JlbmVmaXRzX2dlbmVyYWxfcHVibGljJ11cclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgZm9ybWF0dGVyID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLk51bWJlckZvcm1hdChncm91cGluZ1N5bWJvbDogJywnICwgZnJhY3Rpb25EaWdpdHM6ICcwJylcclxuICAgICAgICAgICAgICBmb3JtYXR0ZXIuZm9ybWF0KHZpc19kYXRhLCAxKTtcclxuICAgICAgICAgICAgICBmb3JtYXR0ZXIuZm9ybWF0KHZpc19kYXRhLCAyKTtcclxuICAgICAgICAgICAgICBvcHRpb25zID1cclxuICAgICAgICAgICAgICAgICd0aXRsZSc6J01lZGlhbiBUb3RhbCBDb21wZW5zYXRpb24gLSBGdWxsIFRpbWUgV29ya2VyczogXFxuIEdvdmVybm1lbnQgdnMuIFByaXZhdGUgU2VjdG9yJ1xyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogMzQwXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogMzAwXHJcbiAgICAgICAgICAgICAgICAnaXNTdGFja2VkJzogJ3RydWUnXHJcbiAgICAgICAgICAgICAgICAnY29sb3JzJzogWycjMDA1Y2U2JywgJyMwMDk5MzMnXVxyXG4gICAgICAgICAgICAgIGNoYXJ0ID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLkNvbHVtbkNoYXJ0IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICdtZWRpYW4tY29tcC1ncmFwaCdcclxuICAgICAgICAgICAgICBjaGFydC5kcmF3IHZpc19kYXRhLCBvcHRpb25zXHJcbiAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgICksIDEwMDBcclxuICAgICAgICAgIGdvb2dsZS5sb2FkICd2aXN1YWxpemF0aW9uJywgJzEuMCcsXHJcbiAgICAgICAgICAnY2FsbGJhY2snIDogZHJhd0NoYXJ0KClcclxuICAgICAgICAgICdwYWNrYWdlcycgOidjb3JlY2hhcnQnXHJcbiAgICAgICAgICBwbG90X2hhbmRsZXNbJ21lZGlhbi1jb21wLWdyYXBoJ10gPSdtZWRpYW4tY29tcC1ncmFwaCdcclxuICAgICAgICBpZiBub3QgcGxvdF9oYW5kbGVzWydtZWRpYW4tcGVuc2lvbi1ncmFwaCddXHJcbiAgICAgICAgICBkcmF3Q2hhcnQgPSAoKSAtPlxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0ICggLT5cclxuICAgICAgICAgICAgICB2aXNfZGF0YSA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5EYXRhVGFibGUoKVxyXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnc3RyaW5nJywgJ01lZGlhbiBQZW5zaW9uJ1xyXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnbnVtYmVyJywgJ1dhZ2VzJ1xyXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZFJvd3MgW1xyXG4gICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICAnUGVuc2lvbiBmb3IgXFxuIFJldGlyZWUgdy8gMzAgWWVhcnMnXHJcbiAgICAgICAgICAgICAgICAgIGRhdGFbJ21lZGlhbl9wZW5zaW9uXzMwX3llYXJfcmV0aXJlZSddXHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgIGZvcm1hdHRlciA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5OdW1iZXJGb3JtYXQoZ3JvdXBpbmdTeW1ib2w6ICcsJyAsIGZyYWN0aW9uRGlnaXRzOiAnMCcpXHJcbiAgICAgICAgICAgICAgZm9ybWF0dGVyLmZvcm1hdCh2aXNfZGF0YSwgMSk7XHJcbiAgICAgICAgICAgICAgb3B0aW9ucyA9XHJcbiAgICAgICAgICAgICAgICAndGl0bGUnOidNZWRpYW4gVG90YWwgUGVuc2lvbidcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6IDM0MFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6IDMwMFxyXG4gICAgICAgICAgICAgICAgJ2lzU3RhY2tlZCc6ICd0cnVlJ1xyXG4gICAgICAgICAgICAgICAgJ2NvbG9ycyc6IFsnIzAwNWNlNicsICcjMDA5OTMzJ11cclxuICAgICAgICAgICAgICAgICdjaGFydEFyZWEud2lkdGgnOiAnNTAlJ1xyXG4gICAgICAgICAgICAgIGNoYXJ0ID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLkNvbHVtbkNoYXJ0IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICdtZWRpYW4tcGVuc2lvbi1ncmFwaCdcclxuICAgICAgICAgICAgICBjaGFydC5kcmF3IHZpc19kYXRhLCBvcHRpb25zXHJcbiAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgICksIDEwMDBcclxuICAgICAgICAgIGdvb2dsZS5sb2FkICd2aXN1YWxpemF0aW9uJywgJzEuMCcsXHJcbiAgICAgICAgICAnY2FsbGJhY2snIDogZHJhd0NoYXJ0KClcclxuICAgICAgICAgICdwYWNrYWdlcycgOidjb3JlY2hhcnQnXHJcbiAgICAgICAgICBwbG90X2hhbmRsZXNbJ21lZGlhbi1wZW5zaW9uLWdyYXBoJ10gPSdtZWRpYW4tcGVuc2lvbi1ncmFwaCdcclxuICAgICAgd2hlbiAnRmluYW5jaWFsIEhlYWx0aCdcclxuICAgICAgICBoID0gJydcclxuICAgICAgICBoICs9IHJlbmRlcl9maWVsZHMgdGFiLmZpZWxkcywgZGF0YSwgdGVtcGxhdGVzWyd0YWJkZXRhaWwtbmFtZXZhbHVlLXRlbXBsYXRlJ11cclxuICAgICAgICBkZXRhaWxfZGF0YS50YWJjb250ZW50ICs9IHRlbXBsYXRlc1sndGFiZGV0YWlsLWZpbmFuY2lhbC1oZWFsdGgtdGVtcGxhdGUnXShjb250ZW50OiBoKVxyXG4gICAgICAgICNwdWJsaWMgc2FmZXR5IHBpZVxyXG4gICAgICAgIGlmIG5vdCBwbG90X2hhbmRsZXNbJ3B1YmxpYy1zYWZldHktcGllJ11cclxuICAgICAgICAgICAgZHJhd0NoYXJ0ID0gKCkgLT5cclxuICAgICAgICAgICAgc2V0VGltZW91dCAoIC0+XHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uRGF0YVRhYmxlKClcclxuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRDb2x1bW4gJ3N0cmluZycsICdQdWJsaWMgU2FmZXR5IEV4cGVuc2UnXHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdudW1iZXInLCAnVG90YWwnXHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkUm93cyBbXHJcbiAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICdQdWJsaWMgU2FmZXR5IEV4cGVuc2UnXHJcbiAgICAgICAgICAgICAgICAgIDEwMCAtIGRhdGFbJ3B1YmxpY19zYWZldHlfZXhwX292ZXJfdG90X2dvdl9mdW5kX3JldmVudWUnXVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICAnT3RoZXIgR292ZXJubWVudGFsIFxcbiBGdW5kIFJldmVudWUnXHJcbiAgICAgICAgICAgICAgICAgIGRhdGFbJ3B1YmxpY19zYWZldHlfZXhwX292ZXJfdG90X2dvdl9mdW5kX3JldmVudWUnXVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICBvcHRpb25zID1cclxuICAgICAgICAgICAgICAgICd0aXRsZSc6J1B1YmxpYyBzYWZldHkgZXhwZW5zZSdcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6IDM0MFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6IDMwMFxyXG4gICAgICAgICAgICAgICAgJ2lzM0QnIDogJ3RydWUnXHJcbiAgICAgICAgICAgICAgICAnY29sb3JzJzogWycjMDA1Y2U2JywgJyMwMDk5MzMnXVxyXG4gICAgICAgICAgICAgICAgJ3NsaWNlcyc6IHsgMToge29mZnNldDogMC4yfX1cclxuICAgICAgICAgICAgICAgICdwaWVTdGFydEFuZ2xlJzogMjBcclxuICAgICAgICAgICAgICBjaGFydCA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5QaWVDaGFydCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAncHVibGljLXNhZmV0eS1waWUnXHJcbiAgICAgICAgICAgICAgY2hhcnQuZHJhdyB2aXNfZGF0YSwgb3B0aW9uc1xyXG4gICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICApLCAxMDAwXHJcbiAgICAgICAgICBnb29nbGUubG9hZCAndmlzdWFsaXphdGlvbicsICcxLjAnLFxyXG4gICAgICAgICAgJ2NhbGxiYWNrJyA6IGRyYXdDaGFydCgpXHJcbiAgICAgICAgICAncGFja2FnZXMnIDonY29yZWNoYXJ0J1xyXG4gICAgICAgICAgcGxvdF9oYW5kbGVzWydwdWJsaWMtc2FmZXR5LXBpZSddID0ncHVibGljLXNhZmV0eS1waWUnXHJcbiAgICAgICAgI2Zpbi1oZWFsdGgtcmV2ZW51ZSBncmFwaFxyXG4gICAgICAgIGlmIG5vdCBwbG90X2hhbmRsZXNbJ2Zpbi1oZWFsdGgtcmV2ZW51ZS1ncmFwaCddXHJcbiAgICAgICAgICBkcmF3Q2hhcnQgPSAoKSAtPlxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0ICggLT5cclxuICAgICAgICAgICAgICB2aXNfZGF0YSA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5EYXRhVGFibGUoKVxyXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnc3RyaW5nJywgJ1BlciBDYXBpdGEnXHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdudW1iZXInLCAnUmV2LidcclxuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRSb3dzIFtcclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgJ1RvdGFsIFJldmVudWUgXFxuIFBlciBDYXBpdGEnXHJcbiAgICAgICAgICAgICAgICAgIGRhdGFbJ3RvdGFsX3JldmVudWVfcGVyX2NhcGl0YSddXHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICdNZWRpYW4gVG90YWwgUmV2ZW51ZSBQZXIgXFxuIENhcGl0YSBGb3IgQWxsIENpdGllcydcclxuICAgICAgICAgICAgICAgICAgNDIwXHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgIG9wdGlvbnMgPVxyXG4gICAgICAgICAgICAgICAgJ3RpdGxlJzonVG90YWwgUmV2ZW51ZSdcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6IDM0MFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6IDMwMFxyXG4gICAgICAgICAgICAgICAgJ2lzU3RhY2tlZCc6ICd0cnVlJ1xyXG4gICAgICAgICAgICAgICAgJ2NvbG9ycyc6IFsnIzAwNWNlNicsICcjMDA5OTMzJ11cclxuICAgICAgICAgICAgICAgICdjaGFydEFyZWEud2lkdGgnOiAnNTAlJ1xyXG4gICAgICAgICAgICAgIGNoYXJ0ID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLkNvbHVtbkNoYXJ0IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICdmaW4taGVhbHRoLXJldmVudWUtZ3JhcGgnXHJcbiAgICAgICAgICAgICAgY2hhcnQuZHJhdyB2aXNfZGF0YSwgb3B0aW9uc1xyXG4gICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICApLCAxMDAwXHJcbiAgICAgICAgICBnb29nbGUubG9hZCAndmlzdWFsaXphdGlvbicsICcxLjAnLFxyXG4gICAgICAgICAgJ2NhbGxiYWNrJyA6IGRyYXdDaGFydCgpXHJcbiAgICAgICAgICAncGFja2FnZXMnIDonY29yZWNoYXJ0J1xyXG4gICAgICAgICAgcGxvdF9oYW5kbGVzWydmaW4taGVhbHRoLXJldmVudWUtZ3JhcGgnXSA9J2Zpbi1oZWFsdGgtcmV2ZW51ZS1ncmFwaCdcclxuICAgICAgICAjZmluLWhlYWx0aC1leHBlbmRpdHVyZXMtZ3JhcGhcclxuICAgICAgICBpZiBub3QgcGxvdF9oYW5kbGVzWydmaW4taGVhbHRoLWV4cGVuZGl0dXJlcy1ncmFwaCddXHJcbiAgICAgICAgICBkcmF3Q2hhcnQgPSAoKSAtPlxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0ICggLT5cclxuICAgICAgICAgICAgICB2aXNfZGF0YSA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5EYXRhVGFibGUoKVxyXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnc3RyaW5nJywgJ1BlciBDYXBpdGEnXHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdudW1iZXInLCAnRXhwLidcclxuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRSb3dzIFtcclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgJ1RvdGFsIEV4cGVuZGl0dXJlcyBcXG4gUGVyIENhcGl0YSdcclxuICAgICAgICAgICAgICAgICAgZGF0YVsndG90YWxfZXhwZW5kaXR1cmVzX3Blcl9jYXBpdGEnXVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICAnTWVkaWFuIFRvdGFsIFxcbiBFeHBlbmRpdHVyZXMgUGVyIENhcGl0YSBcXG4gRm9yIEFsbCBDaXRpZXMnXHJcbiAgICAgICAgICAgICAgICAgIDQyMFxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICBvcHRpb25zID1cclxuICAgICAgICAgICAgICAgICd0aXRsZSc6J1RvdGFsIEV4cGVuZGl0dXJlcydcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6IDM0MFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6IDMwMFxyXG4gICAgICAgICAgICAgICAgJ2lzU3RhY2tlZCc6ICd0cnVlJ1xyXG4gICAgICAgICAgICAgICAgJ2NvbG9ycyc6IFsnIzAwNWNlNicsICcjMDA5OTMzJ11cclxuICAgICAgICAgICAgICAgICdjaGFydEFyZWEud2lkdGgnOiAnNTAlJ1xyXG4gICAgICAgICAgICAgIGNoYXJ0ID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLkNvbHVtbkNoYXJ0IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICdmaW4taGVhbHRoLWV4cGVuZGl0dXJlcy1ncmFwaCdcclxuICAgICAgICAgICAgICBjaGFydC5kcmF3IHZpc19kYXRhLCBvcHRpb25zXHJcbiAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgICksIDEwMDBcclxuICAgICAgICAgIGdvb2dsZS5sb2FkICd2aXN1YWxpemF0aW9uJywgJzEuMCcsXHJcbiAgICAgICAgICAnY2FsbGJhY2snIDogZHJhd0NoYXJ0KClcclxuICAgICAgICAgICdwYWNrYWdlcycgOidjb3JlY2hhcnQnXHJcbiAgICAgICAgICBwbG90X2hhbmRsZXNbJ2Zpbi1oZWFsdGgtZXhwZW5kaXR1cmVzLWdyYXBoJ10gPSdmaW4taGVhbHRoLWV4cGVuZGl0dXJlcy1ncmFwaCdcclxuICAgICAgd2hlbiAnRmluYW5jaWFsIFN0YXRlbWVudHMnXHJcbiAgICAgICAgaWYgZGF0YS5maW5hbmNpYWxfc3RhdGVtZW50c1xyXG4gICAgICAgICAgaCA9ICcnXHJcbiAgICAgICAgICAjaCArPSByZW5kZXJfZmllbGRzIHRhYi5maWVsZHMsIGRhdGEsIHRlbXBsYXRlc1sndGFiZGV0YWlsLW5hbWV2YWx1ZS10ZW1wbGF0ZSddXHJcbiAgICAgICAgICBoICs9IHJlbmRlcl9maW5hbmNpYWxfZmllbGRzIGRhdGEuZmluYW5jaWFsX3N0YXRlbWVudHMsIHRlbXBsYXRlc1sndGFiZGV0YWlsLWZpbnN0YXRlbWVudC10ZW1wbGF0ZSddXHJcbiAgICAgICAgICBkZXRhaWxfZGF0YS50YWJjb250ZW50ICs9IHRlbXBsYXRlc1sndGFiZGV0YWlsLWZpbmFuY2lhbC1zdGF0ZW1lbnRzLXRlbXBsYXRlJ10oY29udGVudDogaClcclxuICAgICAgICAgICN0YWJkZXRhaWwtZmluYW5jaWFsLXN0YXRlbWVudHMtdGVtcGxhdGVcclxuICAgICAgICAgIGlmIG5vdCBwbG90X2hhbmRsZXNbJ3RvdGFsLWV4cGVuZGl0dXJlcy1waWUnXVxyXG4gICAgICAgICAgICBkcmF3Q2hhcnQgPSAoKSAtPlxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0ICggLT5cclxuICAgICAgICAgICAgICB2aXNfZGF0YSA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5EYXRhVGFibGUoKVxyXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnc3RyaW5nJywgJ1RvdGFsIEdvdi4gRXhwZW5kaXR1cmVzJ1xyXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnbnVtYmVyJywgJ1RvdGFsJ1xyXG5cclxuICAgICAgICAgICAgICByb3dzID0gW11cclxuICAgICAgICAgICAgICBmb3IgaXRlbSBpbiBkYXRhLmZpbmFuY2lhbF9zdGF0ZW1lbnRzXHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbS5jYXRlZ29yeV9uYW1lIGlzIFwiRXhwZW5kaXR1cmVzXCIpIGFuZCAoaXRlbS5jYXB0aW9uIGlzbnQgXCJUb3RhbCBFeHBlbmRpdHVyZXNcIilcclxuXHJcbiAgICAgICAgICAgICAgICAgIHIgPSBbXHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5jYXB0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQgaXRlbS50b3RhbGZ1bmRzXHJcbiAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgICAgcm93cy5wdXNoKHIpXHJcblxyXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZFJvd3Mgcm93c1xyXG4gICAgICAgICAgICAgIG9wdGlvbnMgPVxyXG4gICAgICAgICAgICAgICAgJ3RpdGxlJzonVG90YWwgRXhwZW5kaXR1cmVzJ1xyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogNDAwXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogMzUwXHJcbiAgICAgICAgICAgICAgICAncGllU3RhcnRBbmdsZSc6IDIwXHJcbiAgICAgICAgICAgICAgICAjJ2lzM0QnIDogJ3RydWUnXHJcbiAgICAgICAgICAgICAgY2hhcnQgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uUGllQ2hhcnQgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgJ3RvdGFsLWV4cGVuZGl0dXJlcy1waWUnXHJcbiAgICAgICAgICAgICAgY2hhcnQuZHJhdyB2aXNfZGF0YSwgb3B0aW9uc1xyXG4gICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICApLCAxMDAwXHJcbiAgICAgICAgICBnb29nbGUubG9hZCAndmlzdWFsaXphdGlvbicsICcxLjAnLFxyXG4gICAgICAgICAgJ2NhbGxiYWNrJyA6IGRyYXdDaGFydCgpXHJcbiAgICAgICAgICAncGFja2FnZXMnIDonY29yZWNoYXJ0J1xyXG4gICAgICAgICAgcGxvdF9oYW5kbGVzWyd0b3RhbC1leHBlbmRpdHVyZXMtcGllJ10gPSd0b3RhbC1leHBlbmRpdHVyZXMtcGllJ1xyXG4gICAgICBlbHNlXHJcbiAgICAgICAgZGV0YWlsX2RhdGEudGFiY29udGVudCArPSByZW5kZXJfZmllbGRzIHRhYi5maWVsZHMsIGRhdGEsIHRlbXBsYXRlc1sndGFiZGV0YWlsLW5hbWV2YWx1ZS10ZW1wbGF0ZSddXHJcblxyXG4gICAgbGF5b3V0X2RhdGEudGFiY29udGVudCArPSB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC10ZW1wbGF0ZSddKGRldGFpbF9kYXRhKVxyXG4gIHJldHVybiB0ZW1wbGF0ZXNbJ3RhYnBhbmVsLXRlbXBsYXRlJ10obGF5b3V0X2RhdGEpXHJcblxyXG5cclxuZ2V0X2xheW91dF9maWVsZHMgPSAobGEpIC0+XHJcbiAgZiA9IHt9XHJcbiAgZm9yIHQgaW4gbGFcclxuICAgIGZvciBmaWVsZCBpbiB0LmZpZWxkc1xyXG4gICAgICBmW2ZpZWxkXSA9IDFcclxuICByZXR1cm4gZlxyXG5cclxuZ2V0X3JlY29yZF9maWVsZHMgPSAocikgLT5cclxuICBmID0ge31cclxuICBmb3IgZmllbGRfbmFtZSBvZiByXHJcbiAgICBmW2ZpZWxkX25hbWVdID0gMVxyXG4gIHJldHVybiBmXHJcblxyXG5nZXRfdW5tZW50aW9uZWRfZmllbGRzID0gKGxhLCByKSAtPlxyXG4gIGxheW91dF9maWVsZHMgPSBnZXRfbGF5b3V0X2ZpZWxkcyBsYVxyXG4gIHJlY29yZF9maWVsZHMgPSBnZXRfcmVjb3JkX2ZpZWxkcyByXHJcbiAgdW5tZW50aW9uZWRfZmllbGRzID0gW11cclxuICB1bm1lbnRpb25lZF9maWVsZHMucHVzaChmKSBmb3IgZiBvZiByZWNvcmRfZmllbGRzIHdoZW4gbm90IGxheW91dF9maWVsZHNbZl1cclxuICByZXR1cm4gdW5tZW50aW9uZWRfZmllbGRzXHJcblxyXG5cclxuYWRkX290aGVyX3RhYl90b19sYXlvdXQgPSAobGF5b3V0PVtdLCBkYXRhKSAtPlxyXG4gICNjbG9uZSB0aGUgbGF5b3V0XHJcbiAgbCA9ICQuZXh0ZW5kIHRydWUsIFtdLCBsYXlvdXRcclxuICB0ID1cclxuICAgIG5hbWU6IFwiT3RoZXJcIlxyXG4gICAgZmllbGRzOiBnZXRfdW5tZW50aW9uZWRfZmllbGRzIGwsIGRhdGFcclxuXHJcbiAgbC5wdXNoIHRcclxuICByZXR1cm4gbFxyXG5cclxuXHJcbiMgY29udmVydHMgdGFiIHRlbXBsYXRlIGRlc2NyaWJlZCBpbiBnb29nbGUgZnVzaW9uIHRhYmxlIHRvXHJcbiMgdGFiIHRlbXBsYXRlXHJcbmNvbnZlcnRfZnVzaW9uX3RlbXBsYXRlPSh0ZW1wbCkgLT5cclxuICB0YWJfaGFzaD17fVxyXG4gIHRhYnM9W11cclxuICAjIHJldHVybnMgaGFzaCBvZiBmaWVsZCBuYW1lcyBhbmQgdGhlaXIgcG9zaXRpb25zIGluIGFycmF5IG9mIGZpZWxkIG5hbWVzXHJcbiAgZ2V0X2NvbF9oYXNoID0gKGNvbHVtbnMpIC0+XHJcbiAgICBjb2xfaGFzaCA9e31cclxuICAgIGNvbF9oYXNoW2NvbF9uYW1lXT1pIGZvciBjb2xfbmFtZSxpIGluIHRlbXBsLmNvbHVtbnNcclxuICAgIHJldHVybiBjb2xfaGFzaFxyXG5cclxuICAjIHJldHVybnMgZmllbGQgdmFsdWUgYnkgaXRzIG5hbWUsIGFycmF5IG9mIGZpZWxkcywgYW5kIGhhc2ggb2YgZmllbGRzXHJcbiAgdmFsID0gKGZpZWxkX25hbWUsIGZpZWxkcywgY29sX2hhc2gpIC0+XHJcbiAgICBmaWVsZHNbY29sX2hhc2hbZmllbGRfbmFtZV1dXHJcblxyXG4gICMgY29udmVydHMgaGFzaCB0byBhbiBhcnJheSB0ZW1wbGF0ZVxyXG4gIGhhc2hfdG9fYXJyYXkgPShoYXNoKSAtPlxyXG4gICAgYSA9IFtdXHJcbiAgICBmb3IgayBvZiBoYXNoXHJcbiAgICAgIHRhYiA9IHt9XHJcbiAgICAgIHRhYi5uYW1lPWtcclxuICAgICAgdGFiLmZpZWxkcz1oYXNoW2tdXHJcbiAgICAgIGEucHVzaCB0YWJcclxuICAgIHJldHVybiBhXHJcblxyXG5cclxuICBjb2xfaGFzaCA9IGdldF9jb2xfaGFzaCh0ZW1wbC5jb2xfaGFzaClcclxuICBwbGFjZWhvbGRlcl9jb3VudCA9IDBcclxuXHJcbiAgZm9yIHJvdyxpIGluIHRlbXBsLnJvd3NcclxuICAgIGNhdGVnb3J5ID0gdmFsICdnZW5lcmFsX2NhdGVnb3J5Jywgcm93LCBjb2xfaGFzaFxyXG4gICAgI3RhYl9oYXNoW2NhdGVnb3J5XT1bXSB1bmxlc3MgdGFiX2hhc2hbY2F0ZWdvcnldXHJcbiAgICBmaWVsZG5hbWUgPSB2YWwgJ2ZpZWxkX25hbWUnLCByb3csIGNvbF9oYXNoXHJcbiAgICBpZiBub3QgZmllbGRuYW1lIHRoZW4gZmllbGRuYW1lID0gXCJfXCIgKyBTdHJpbmcgKytwbGFjZWhvbGRlcl9jb3VudFxyXG4gICAgZmllbGROYW1lc1t2YWwgJ2ZpZWxkX25hbWUnLCByb3csIGNvbF9oYXNoXT12YWwgJ2Rlc2NyaXB0aW9uJywgcm93LCBjb2xfaGFzaFxyXG4gICAgZmllbGROYW1lc0hlbHBbZmllbGRuYW1lXSA9IHZhbCAnaGVscF90ZXh0Jywgcm93LCBjb2xfaGFzaFxyXG4gICAgaWYgY2F0ZWdvcnlcclxuICAgICAgdGFiX2hhc2hbY2F0ZWdvcnldPz1bXVxyXG4gICAgICB0YWJfaGFzaFtjYXRlZ29yeV0ucHVzaCBuOiB2YWwoJ24nLCByb3csIGNvbF9oYXNoKSwgbmFtZTogZmllbGRuYW1lLCBtYXNrOiB2YWwoJ21hc2snLCByb3csIGNvbF9oYXNoKVxyXG5cclxuICBjYXRlZ29yaWVzID0gT2JqZWN0LmtleXModGFiX2hhc2gpXHJcbiAgY2F0ZWdvcmllc19zb3J0ID0ge31cclxuICBmb3IgY2F0ZWdvcnkgaW4gY2F0ZWdvcmllc1xyXG4gICAgaWYgbm90IGNhdGVnb3JpZXNfc29ydFtjYXRlZ29yeV1cclxuICAgICAgY2F0ZWdvcmllc19zb3J0W2NhdGVnb3J5XSA9IHRhYl9oYXNoW2NhdGVnb3J5XVswXS5uXHJcbiAgICBmaWVsZHMgPSBbXVxyXG4gICAgZm9yIG9iaiBpbiB0YWJfaGFzaFtjYXRlZ29yeV1cclxuICAgICAgZmllbGRzLnB1c2ggb2JqXHJcbiAgICBmaWVsZHMuc29ydCAoYSxiKSAtPlxyXG4gICAgICByZXR1cm4gYS5uIC0gYi5uXHJcbiAgICB0YWJfaGFzaFtjYXRlZ29yeV0gPSBmaWVsZHNcclxuXHJcbiAgY2F0ZWdvcmllc19hcnJheSA9IFtdXHJcbiAgZm9yIGNhdGVnb3J5LCBuIG9mIGNhdGVnb3JpZXNfc29ydFxyXG4gICAgY2F0ZWdvcmllc19hcnJheS5wdXNoIGNhdGVnb3J5OiBjYXRlZ29yeSwgbjogblxyXG4gIGNhdGVnb3JpZXNfYXJyYXkuc29ydCAoYSxiKSAtPlxyXG4gICAgcmV0dXJuIGEubiAtIGIublxyXG5cclxuICB0YWJfbmV3aGFzaCA9IHt9XHJcbiAgZm9yIGNhdGVnb3J5IGluIGNhdGVnb3JpZXNfYXJyYXlcclxuICAgIHRhYl9uZXdoYXNoW2NhdGVnb3J5LmNhdGVnb3J5XSA9IHRhYl9oYXNoW2NhdGVnb3J5LmNhdGVnb3J5XVxyXG5cclxuICB0YWJzID0gaGFzaF90b19hcnJheSh0YWJfbmV3aGFzaClcclxuICByZXR1cm4gdGFic1xyXG5cclxuXHJcbmNsYXNzIFRlbXBsYXRlczJcclxuXHJcbiAgQGxpc3QgPSB1bmRlZmluZWRcclxuICBAdGVtcGxhdGVzID0gdW5kZWZpbmVkXHJcbiAgQGRhdGEgPSB1bmRlZmluZWRcclxuICBAZXZlbnRzID0gdW5kZWZpbmVkXHJcblxyXG4gIGNvbnN0cnVjdG9yOigpIC0+XHJcbiAgICBAbGlzdCA9IFtdXHJcbiAgICBAZXZlbnRzID0ge31cclxuICAgIHRlbXBsYXRlTGlzdCA9IFsndGFicGFuZWwtdGVtcGxhdGUnLCAndGFiZGV0YWlsLXRlbXBsYXRlJywgJ3RhYmRldGFpbC1uYW1ldmFsdWUtdGVtcGxhdGUnLCAndGFiZGV0YWlsLWZpbnN0YXRlbWVudC10ZW1wbGF0ZScsICd0YWJkZXRhaWwtb2ZmaWNpYWwtdGVtcGxhdGUnLCAndGFiZGV0YWlsLWVtcGxveWVlLWNvbXAtdGVtcGxhdGUnLCAndGFiZGV0YWlsLWZpbmFuY2lhbC1oZWFsdGgtdGVtcGxhdGUnLCAndGFiZGV0YWlsLWZpbmFuY2lhbC1zdGF0ZW1lbnRzLXRlbXBsYXRlJ11cclxuICAgIHRlbXBsYXRlUGFydGlhbHMgPSBbJ3RhYi10ZW1wbGF0ZSddXHJcbiAgICBAdGVtcGxhdGVzID0ge31cclxuICAgIGZvciB0ZW1wbGF0ZSxpIGluIHRlbXBsYXRlTGlzdFxyXG4gICAgICBAdGVtcGxhdGVzW3RlbXBsYXRlXSA9IEhhbmRsZWJhcnMuY29tcGlsZSgkKCcjJyArIHRlbXBsYXRlKS5odG1sKCkpXHJcbiAgICBmb3IgdGVtcGxhdGUsaSBpbiB0ZW1wbGF0ZVBhcnRpYWxzXHJcbiAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJQYXJ0aWFsKHRlbXBsYXRlLCAkKCcjJyArIHRlbXBsYXRlKS5odG1sKCkpXHJcblxyXG4gIGFkZF90ZW1wbGF0ZTogKGxheW91dF9uYW1lLCBsYXlvdXRfanNvbikgLT5cclxuICAgIEBsaXN0LnB1c2hcclxuICAgICAgcGFyZW50OnRoaXNcclxuICAgICAgbmFtZTpsYXlvdXRfbmFtZVxyXG4gICAgICByZW5kZXI6KGRhdCkgLT5cclxuICAgICAgICBAcGFyZW50LmRhdGEgPSBkYXRcclxuICAgICAgICByZW5kZXJfdGFicyhsYXlvdXRfanNvbiwgZGF0LCB0aGlzLCBAcGFyZW50KVxyXG4gICAgICBiaW5kOiAodHBsX25hbWUsIGNhbGxiYWNrKSAtPlxyXG4gICAgICAgIGlmIG5vdCBAcGFyZW50LmV2ZW50c1t0cGxfbmFtZV1cclxuICAgICAgICAgIEBwYXJlbnQuZXZlbnRzW3RwbF9uYW1lXSA9IFtjYWxsYmFja11cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICBAcGFyZW50LmV2ZW50c1t0cGxfbmFtZV0ucHVzaCBjYWxsYmFja1xyXG4gICAgICBhY3RpdmF0ZTogKHRwbF9uYW1lKSAtPlxyXG4gICAgICAgIGlmIEBwYXJlbnQuZXZlbnRzW3RwbF9uYW1lXVxyXG4gICAgICAgICAgZm9yIGUsaSBpbiBAcGFyZW50LmV2ZW50c1t0cGxfbmFtZV1cclxuICAgICAgICAgICAgZSB0cGxfbmFtZSwgQHBhcmVudC5kYXRhXHJcblxyXG4gIGxvYWRfdGVtcGxhdGU6KHRlbXBsYXRlX25hbWUsIHVybCkgLT5cclxuICAgICQuYWpheFxyXG4gICAgICB1cmw6IHVybFxyXG4gICAgICBkYXRhVHlwZTogJ2pzb24nXHJcbiAgICAgIGNhY2hlOiB0cnVlXHJcbiAgICAgIHN1Y2Nlc3M6ICh0ZW1wbGF0ZV9qc29uKSA9PlxyXG4gICAgICAgIEBhZGRfdGVtcGxhdGUodGVtcGxhdGVfbmFtZSwgdGVtcGxhdGVfanNvbilcclxuICAgICAgICByZXR1cm5cclxuXHJcbiAgbG9hZF9mdXNpb25fdGVtcGxhdGU6KHRlbXBsYXRlX25hbWUsIHVybCkgLT5cclxuICAgICQuYWpheFxyXG4gICAgICB1cmw6IHVybFxyXG4gICAgICBkYXRhVHlwZTogJ2pzb24nXHJcbiAgICAgIGNhY2hlOiB0cnVlXHJcbiAgICAgIHN1Y2Nlc3M6ICh0ZW1wbGF0ZV9qc29uKSA9PlxyXG4gICAgICAgIHQgPSBjb252ZXJ0X2Z1c2lvbl90ZW1wbGF0ZSB0ZW1wbGF0ZV9qc29uXHJcbiAgICAgICAgQGFkZF90ZW1wbGF0ZSh0ZW1wbGF0ZV9uYW1lLCB0KVxyXG4gICAgICAgIHJldHVyblxyXG5cclxuXHJcbiAgZ2V0X25hbWVzOiAtPlxyXG4gICAgKHQubmFtZSBmb3IgdCBpbiBAbGlzdClcclxuXHJcbiAgZ2V0X2luZGV4X2J5X25hbWU6IChuYW1lKSAtPlxyXG4gICAgZm9yIHQsaSBpbiBAbGlzdFxyXG4gICAgICBpZiB0Lm5hbWUgaXMgbmFtZVxyXG4gICAgICAgIHJldHVybiBpXHJcbiAgICAgcmV0dXJuIC0xXHJcblxyXG4gIGdldF9odG1sOiAoaW5kLCBkYXRhKSAtPlxyXG4gICAgaWYgKGluZCBpcyAtMSkgdGhlbiByZXR1cm4gIFwiXCJcclxuXHJcbiAgICBpZiBAbGlzdFtpbmRdXHJcbiAgICAgIHJldHVybiBAbGlzdFtpbmRdLnJlbmRlcihkYXRhKVxyXG4gICAgZWxzZVxyXG4gICAgICByZXR1cm4gXCJcIlxyXG5cclxuICBhY3RpdmF0ZTogKGluZCwgdHBsX25hbWUpIC0+XHJcbiAgICBpZiBAbGlzdFtpbmRdXHJcbiAgICAgIEBsaXN0W2luZF0uYWN0aXZhdGUgdHBsX25hbWVcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVGVtcGxhdGVzMlxyXG4iXX0=
