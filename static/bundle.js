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

$(document).on('click', function(e) {
  return $('[data-toggle="tooltip"]').tooltip();
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
var Templates2, add_other_tab_to_layout, convert_fusion_template, fieldNames, get_layout_fields, get_record_fields, get_unmentioned_fields, ranks, render_field, render_field_name, render_field_value, render_fields, render_financial_fields, render_subheading, render_tabs, under;

fieldNames = {};

ranks = [];

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
        return v = v.substring(0, 19) + ("…<div style='display:inline;color:#074d71'  class='tooltipgo' data-toggle='tooltip' title='" + v + "'>Read More</div>");
      } else {
        return v;
      }
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
  var fName, fValue, field, h, i, j, len;
  h = '';
  for (i = j = 0, len = fields.length; j < len; i = ++j) {
    field = fields[i];
    if (typeof field === "object") {
      if (field.mask === "heading") {
        h += render_subheading(field.name, field.mask, i);
        fValue = '';
      } else {
        fValue = render_field_value(field.name, field.mask, data);
        if ('' !== fValue) {
          fName = render_field_name(field.name);
        }
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
    if (field.caption === 'General Fund Balance' || field.caption === 'Long Term Debt') {
      h += template({
        name: field.caption,
        genfund: numeral(field.genfund).format(mask)
      });
    } else {
      h += template({
        name: field.caption,
        genfund: numeral(field.genfund).format(mask),
        otherfunds: numeral(field.otherfunds).format(mask),
        totalfunds: numeral(field.totalfunds).format(mask)
      });
    }
  }
  return h;
};

under = function(s) {
  return s.replace(/[\s\+\-]/g, '_');
};

render_tabs = function(initial_layout, data, tabset, parent) {
  var detail_data, drawChart, h, i, j, layout, layout_data, len, len1, len2, len3, m, o, official, official_data, p, plot_handles, r, ref, tab, templates;
  for (j = 0, len = ranks.length; j < len; j++) {
    r = ranks[j];
    console.log(data["" + r]);
  }
  layout = initial_layout;
  templates = parent.templates;
  plot_handles = {};
  layout_data = {
    title: data.gov_name,
    wikipedia_page_exists: data.wikipedia_page_exists,
    wikipedia_page_name: data.wikipedia_page_name,
    transparent_california_page_name: data.transparent_california_page_name,
    tabs: [],
    tabcontent: ''
  };
  for (i = m = 0, len1 = layout.length; m < len1; i = ++m) {
    tab = layout[i];
    layout_data.tabs.push({
      tabid: under(tab.name),
      tabname: tab.name,
      active: (i > 0 ? '' : 'active')
    });
  }
  for (i = o = 0, len2 = layout.length; o < len2; i = ++o) {
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
        for (i = p = 0, len3 = ref.length; p < len3; i = ++p) {
          official = ref[i];
          official_data = {
            title: '' !== official.title ? "Title: " + official.title : '',
            name: '' !== official.full_name ? "Name: " + official.full_name : '',
            email: null !== official.email_address ? "Email: " + official.email_address : 'Email: ',
            telephonenumber: null !== official.telephone_number && void 0 !== official.telephone_number ? "Telephone Number:" + official.telephone_number : "Telephone Number:",
            termexpires: null !== official.term_expires ? "Term Expires: " + official.term_expires : 'Term Expires: '
          };
          if ('' !== official.photo_url) {
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
              vis_data.addRows([['Full Time Employees', data['median_salary_per_full_time_emp'], data['median_benefits_per_ft_emp']], ['General Public', data['median_wages_general_public'], data['median_benefits_general_public']]]);
              formatter = new google.visualization.NumberFormat({
                groupingSymbol: ',',
                fractionDigits: '0'
              });
              formatter.format(vis_data, 1);
              formatter.format(vis_data, 2);
              options = {
                'title': 'Median Total Compensation - Full Time Workers:',
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
              vis_data.addColumn('number', 'Bens.');
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
            vis_data.addColumn('string', 'Public safety expense');
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
  var categories, categories_array, categories_sort, category, col_hash, fieldname, fields, get_col_hash, hash_to_array, i, j, len, len1, len2, len3, m, n, o, obj, p, placeholder_count, rank, ref, ref1, row, tab_hash, tab_newhash, tabs, val;
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
    rank = val('rank', row, col_hash);
    if (rank === 'x') {
      ranks.push(fieldname + "_rank");
    }
    if (category) {
      if (tab_hash[category] == null) {
        tab_hash[category] = [];
      }
      tab_hash[category].push({
        n: val('n', row, col_hash),
        name: fieldname,
        mask: val('mask', row, col_hash),
        rank: val('rank', row, col_hash)
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2Rhc2Vpbi9tamNoL2dvdndpa2kvZ292d2lraS1kZXYudXMvY29mZmVlL2dvdm1hcC5jb2ZmZWUiLCIvVXNlcnMvZGFzZWluL21qY2gvZ292d2lraS9nb3Z3aWtpLWRldi51cy9jb2ZmZWUvZ292c2VsZWN0b3IuY29mZmVlIiwiL1VzZXJzL2Rhc2Vpbi9tamNoL2dvdndpa2kvZ292d2lraS1kZXYudXMvY29mZmVlL21haW4uY29mZmVlIiwiL1VzZXJzL2Rhc2Vpbi9tamNoL2dvdndpa2kvZ292d2lraS1kZXYudXMvY29mZmVlL3F1ZXJ5bWF0Y2hlci5jb2ZmZWUiLCIvVXNlcnMvZGFzZWluL21qY2gvZ292d2lraS9nb3Z3aWtpLWRldi51cy9jb2ZmZWUvdGVtcGxhdGVzMi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxJQUFBOztBQUFBLGNBQUEsR0FBZTs7QUFHZixHQUFBLEdBQVUsSUFBQSxLQUFBLENBQ1I7RUFBQSxFQUFBLEVBQUksU0FBSjtFQUNBLEdBQUEsRUFBSyxVQURMO0VBRUEsR0FBQSxFQUFLLENBQUMsV0FGTjtFQUdBLElBQUEsRUFBSyxDQUhMO0VBSUEsV0FBQSxFQUFhLEtBSmI7RUFLQSxVQUFBLEVBQVksS0FMWjtFQU1BLFdBQUEsRUFBYSxJQU5iO0VBT0Esa0JBQUEsRUFDRTtJQUFBLEtBQUEsRUFBTyxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQXBDO0dBUkY7RUFTQSxjQUFBLEVBQWdCLFNBQUE7V0FDZCx1QkFBQSxDQUF3QixHQUF4QjtFQURjLENBVGhCO0NBRFE7O0FBY1YsdUJBQUEsR0FBMkIsU0FBQyxJQUFEO0VBQ3pCLFlBQUEsQ0FBYSxjQUFiO1NBQ0EsY0FBQSxHQUFpQixVQUFBLENBQVcsaUJBQVgsRUFBOEIs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QUEsQ0FBSSxDQUFDLFFBQVgsQ0FBb0IsUUFBcEIsRUFERjs7RUFEUTs7Ozs7O0FBSVosTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiYm91bmRzX3RpbWVvdXQ9dW5kZWZpbmVkXG5cblxubWFwID0gbmV3IEdNYXBzXG4gIGVsOiAnI2dvdm1hcCdcbiAgbGF0OiAzNy4zNzg5MDA4XG4gIGxuZzogLTExNy4xOTE2MjgzXG4gIHpvb206NlxuICBzY3JvbGx3aGVlbDogZmFsc2VcbiAgcGFuQ29udHJvbDogZmFsc2VcbiAgem9vbUNvbnRyb2w6IHRydWVcbiAgem9vbUNvbnRyb2xPcHRpb25zOlxuICAgIHN0eWxlOiBnb29nbGUubWFwcy5ab29tQ29udHJvbFN0eWxlLlNNQUxMXG4gIGJvdW5kc19jaGFuZ2VkOiAtPlxuICAgIG9uX2JvdW5kc19jaGFuZ2VkX2xhdGVyIDIwMFxuXG5cbm9uX2JvdW5kc19jaGFuZ2VkX2xhdGVyICA9IChtc2VjKSAgLT5cbiAgY2xlYXJUaW1lb3V0IGJvdW5kc190aW1lb3V0XG4gIGJvdW5kc190aW1lb3V0ID0gc2V0VGltZW91dCBvbl9ib3VuZHNfY2hhbmdlZCwgbXNlY1xuXG4gICAgXG5vbl9ib3VuZHNfY2hhbmdlZCA9KGUpIC0+XG4gIGNvbnNvbGUubG9nIFwiYm91bmRzX2NoYW5nZWRcIlxuICBiPW1hcC5nZXRCb3VuZHMoKVxuICB1cmxfdmFsdWU9Yi50b1VybFZhbHVlKClcbiAgbmU9Yi5nZXROb3J0aEVhc3QoKVxuICBzdz1iLmdldFNvdXRoV2VzdCgpXG4gIG5lX2xhdD1uZS5sYXQoKVxuICBuZV9sbmc9bmUubG5nKClcbiAgc3dfbGF0PXN3LmxhdCgpXG4gIHN3X2xuZz1zdy5sbmcoKVxuICBzdCA9IEdPVldJS0kuc3RhdGVfZmlsdGVyXG4gIHR5ID0gR09WV0lLSS5nb3ZfdHlwZV9maWx0ZXJcblxuICAjIyNcbiAgIyBCdWlsZCB0aGUgcXVlcnkuXG4gIHE9XCJcIlwiIFwibGF0aXR1ZGVcIjp7XCIkbHRcIjoje25lX2xhdH0sXCIkZ3RcIjoje3N3X2xhdH19LFwibG9uZ2l0dWRlXCI6e1wiJGx0XCI6I3tuZV9sbmd9LFwiJGd0XCI6I3tzd19sbmd9fVwiXCJcIlxuICAjIEFkZCBmaWx0ZXJzIGlmIHRoZXkgZXhpc3RcbiAgcSs9XCJcIlwiLFwic3RhdGVcIjpcIiN7c3R9XCIgXCJcIlwiIGlmIHN0XG4gIHErPVwiXCJcIixcImdvdl90eXBlXCI6XCIje3R5fVwiIFwiXCJcIiBpZiB0eVxuXG5cbiAgZ2V0X3JlY29yZHMgcSwgMjAwLCAgKGRhdGEpIC0+XG4gICAgI2NvbnNvbGUubG9nIFwibGVuZ3RoPSN7ZGF0YS5sZW5ndGh9XCJcbiAgICAjY29uc29sZS5sb2cgXCJsYXQ6ICN7bmVfbGF0fSwje3N3X2xhdH0gbG5nOiAje25lX2xuZ30sICN7c3dfbG5nfVwiXG4gICAgbWFwLnJlbW92ZU1hcmtlcnMoKVxuICAgIGFkZF9tYXJrZXIocmVjKSBmb3IgcmVjIGluIGRhdGFcbiAgICByZXR1cm5cbiAgIyMjXG5cbiAgIyBCdWlsZCB0aGUgcXVlcnkgMi5cbiAgcTI9XCJcIlwiIGxhdGl0dWRlPCN7bmVfbGF0fSBBTkQgbGF0aXR1ZGU+I3tzd19sYXR9IEFORCBsb25naXR1ZGU8I3tuZV9sbmd9IEFORCBsb25naXR1ZGU+I3tzd19sbmd9IFwiXCJcIlxuICAjIEFkZCBmaWx0ZXJzIGlmIHRoZXkgZXhpc3RcbiAgcTIrPVwiXCJcIiBBTkQgc3RhdGU9XCIje3N0fVwiIFwiXCJcIiBpZiBzdFxuICBxMis9XCJcIlwiIEFORCBnb3ZfdHlwZT1cIiN7dHl9XCIgXCJcIlwiIGlmIHR5XG5cblxuICBnZXRfcmVjb3JkczIgcTIsIDIwMCwgIChkYXRhKSAtPlxuICAgICNjb25zb2xlLmxvZyBcImxlbmd0aD0je2RhdGEubGVuZ3RofVwiXG4gICAgI2NvbnNvbGUubG9nIFwibGF0OiAje25lX2xhdH0sI3tzd19sYXR9IGxuZzogI3tuZV9sbmd9LCAje3N3X2xuZ31cIlxuICAgIG1hcC5yZW1vdmVNYXJrZXJzKClcbiAgICBhZGRfbWFya2VyKHJlYykgZm9yIHJlYyBpbiBkYXRhLnJlY29yZFxuICAgIHJldHVyblxuXG5cblxuZ2V0X2ljb24gPShnb3ZfdHlwZSkgLT5cbiAgXG4gIF9jaXJjbGUgPShjb2xvciktPlxuICAgIHBhdGg6IGdvb2dsZS5tYXBzLlN5bWJvbFBhdGguQ0lSQ0xFXG4gICAgZmlsbE9wYWNpdHk6IDAuNVxuICAgIGZpbGxDb2xvcjpjb2xvclxuICAgIHN0cm9rZVdlaWdodDogMVxuICAgIHN0cm9rZUNvbG9yOid3aGl0ZSdcbiAgICAjc3Ryb2tlUG9zaXRpb246IGdvb2dsZS5tYXBzLlN0cm9rZVBvc2l0aW9uLk9VVFNJREVcbiAgICBzY2FsZTo2XG5cbiAgc3dpdGNoIGdvdl90eXBlXG4gICAgd2hlbiAnR2VuZXJhbCBQdXJwb3NlJyB0aGVuIHJldHVybiBfY2lyY2xlICcjMDNDJ1xuICAgIHdoZW4gJ0NlbWV0ZXJpZXMnICAgICAgdGhlbiByZXR1cm4gX2NpcmNsZSAnIzAwMCdcbiAgICB3aGVuICdIb3NwaXRhbHMnICAgICAgIHRoZW4gcmV0dXJuIF9jaXJjbGUgJyMwQzAnXG4gICAgZWxzZSByZXR1cm4gX2NpcmNsZSAnI0QyMCdcblxuXG5cblxuYWRkX21hcmtlciA9KHJlYyktPlxuICAjY29uc29sZS5sb2cgXCIje3JlYy5yYW5kfSAje3JlYy5pbmNfaWR9ICN7cmVjLnppcH0gI3tyZWMubGF0aXR1ZGV9ICN7cmVjLmxvbmdpdHVkZX0gI3tyZWMuZ292X25hbWV9XCJcbiAgbWFwLmFkZE1hcmtlclxuICAgIGxhdDogcmVjLmxhdGl0dWRlXG4gICAgbG5nOiByZWMubG9uZ2l0dWRlXG4gICAgaWNvbjogZ2V0X2ljb24ocmVjLmdvdl90eXBlKVxuICAgIHRpdGxlOiAgXCIje3JlYy5nb3ZfbmFtZX0sICN7cmVjLmdvdl90eXBlfSAoI3tyZWMubGF0aXR1ZGV9LCAje3JlYy5sb25naXR1ZGV9KVwiXG4gICAgaW5mb1dpbmRvdzpcbiAgICAgIGNvbnRlbnQ6IGNyZWF0ZV9pbmZvX3dpbmRvdyByZWNcbiAgICBjbGljazogKGUpLT5cbiAgICAgICN3aW5kb3cuR09WV0lLSS5zaG93X3JlY29yZCByZWNcbiAgICAgIHdpbmRvdy5HT1ZXSUtJLnNob3dfcmVjb3JkMiByZWNcbiAgXG4gIHJldHVyblxuXG5cbmNyZWF0ZV9pbmZvX3dpbmRvdyA9KHIpIC0+XG4gIHcgPSAkKCc8ZGl2PjwvZGl2PicpXG4gIC5hcHBlbmQgJChcIjxhIGhyZWY9JyMnPjxzdHJvbmc+I3tyLmdvdl9uYW1lfTwvc3Ryb25nPjwvYT5cIikuY2xpY2sgKGUpLT5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zb2xlLmxvZyByXG4gICAgI3dpbmRvdy5HT1ZXSUtJLnNob3dfcmVjb3JkIHJcbiAgICB3aW5kb3cuR09WV0lLSS5zaG93X3JlY29yZDIgclxuXG4gIC5hcHBlbmQgJChcIjxkaXY+ICN7ci5nb3ZfdHlwZX0gICN7ci5jaXR5fSAje3IuemlwfSAje3Iuc3RhdGV9PC9kaXY+XCIpXG4gIHJldHVybiB3WzBdXG5cblxuXG5cbmdldF9yZWNvcmRzID0gKHF1ZXJ5LCBsaW1pdCwgb25zdWNjZXNzKSAtPlxuICAkLmFqYXhcbiAgICB1cmw6IFwiaHR0cHM6Ly9hcGkubW9uZ29sYWIuY29tL2FwaS8xL2RhdGFiYXNlcy9nb3Z3aWtpL2NvbGxlY3Rpb25zL2dvdnMvP3E9eyN7cXVlcnl9fSZmPXtfaWQ6MH0mbD0je2xpbWl0fSZzPXtyYW5kOjF9JmFwaUtleT0wWTVYX1FrMnVPSlJkSEpXSktTUldrNmw2SnFWVFMyeVwiXG4gICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgIGNhY2hlOiB0cnVlXG4gICAgc3VjY2Vzczogb25zdWNjZXNzXG4gICAgZXJyb3I6KGUpIC0+XG4gICAgICBjb25zb2xlLmxvZyBlXG5cblxuZ2V0X3JlY29yZHMyID0gKHF1ZXJ5LCBsaW1pdCwgb25zdWNjZXNzKSAtPlxuICAkLmFqYXhcbiAgICB1cmw6XCJodHRwOi8vNDYuMTAxLjMuNzk6ODAvcmVzdC9kYi9nb3ZzXCJcbiAgICBkYXRhOlxuICAgICAgI2ZpbHRlcjpcImxhdGl0dWRlPjMyIEFORCBsYXRpdHVkZTwzNCBBTkQgbG9uZ2l0dWRlPi04NyBBTkQgbG9uZ2l0dWRlPC04NlwiXG4gICAgICBmaWx0ZXI6cXVlcnlcbiAgICAgIGZpZWxkczpcIl9pZCxpbmNfaWQsZ292X25hbWUsZ292X3R5cGUsY2l0eSx6aXAsc3RhdGUsbGF0aXR1ZGUsbG9uZ2l0dWRlXCJcbiAgICAgIGFwcF9uYW1lOlwiZ292d2lraVwiXG4gICAgICBvcmRlcjpcInJhbmRcIlxuICAgICAgbGltaXQ6bGltaXRcblxuICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICBjYWNoZTogdHJ1ZVxuICAgIHN1Y2Nlc3M6IG9uc3VjY2Vzc1xuICAgIGVycm9yOihlKSAtPlxuICAgICAgY29uc29sZS5sb2cgZVxuXG4jIEdFT0NPRElORyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbnBpbkltYWdlID0gbmV3IChnb29nbGUubWFwcy5NYXJrZXJJbWFnZSkoXG4gICdodHRwOi8vY2hhcnQuYXBpcy5nb29nbGUuY29tL2NoYXJ0P2Noc3Q9ZF9tYXBfcGluX2xldHRlciZjaGxkPVp8Nzc3N0JCfEZGRkZGRicgLFxuICBuZXcgKGdvb2dsZS5tYXBzLlNpemUpKDIxLCAzNCksXG4gIG5ldyAoZ29vZ2xlLm1hcHMuUG9pbnQpKDAsIDApLFxuICBuZXcgKGdvb2dsZS5tYXBzLlBvaW50KSgxMCwgMzQpXG4gIClcblxuXG5nZW9jb2RlX2FkZHIgPSAoYWRkcixkYXRhKSAtPlxuICBHTWFwcy5nZW9jb2RlXG4gICAgYWRkcmVzczogYWRkclxuICAgIGNhbGxiYWNrOiAocmVzdWx0cywgc3RhdHVzKSAtPlxuICAgICAgaWYgc3RhdHVzID09ICdPSydcbiAgICAgICAgbGF0bG5nID0gcmVzdWx0c1swXS5nZW9tZXRyeS5sb2NhdGlvblxuICAgICAgICBtYXAuc2V0Q2VudGVyIGxhdGxuZy5sYXQoKSwgbGF0bG5nLmxuZygpXG4gICAgICAgIG1hcC5hZGRNYXJrZXJcbiAgICAgICAgICBsYXQ6IGxhdGxuZy5sYXQoKVxuICAgICAgICAgIGxuZzogbGF0bG5nLmxuZygpXG4gICAgICAgICAgc2l6ZTogJ3NtYWxsJ1xuICAgICAgICAgIHRpdGxlOiByZXN1bHRzWzBdLmZvcm1hdHRlZF9hZGRyZXNzXG4gICAgICAgICAgaW5mb1dpbmRvdzpcbiAgICAgICAgICAgIGNvbnRlbnQ6IHJlc3VsdHNbMF0uZm9ybWF0dGVkX2FkZHJlc3NcbiAgICAgICAgXG4gICAgICAgIGlmIGRhdGFcbiAgICAgICAgICBtYXAuYWRkTWFya2VyXG4gICAgICAgICAgICBsYXQ6IGRhdGEubGF0aXR1ZGVcbiAgICAgICAgICAgIGxuZzogZGF0YS5sb25naXR1ZGVcbiAgICAgICAgICAgIHNpemU6ICdzbWFsbCdcbiAgICAgICAgICAgIGNvbG9yOiAnYmx1ZSdcbiAgICAgICAgICAgIGljb246IHBpbkltYWdlXG4gICAgICAgICAgICB0aXRsZTogIFwiI3tkYXRhLmxhdGl0dWRlfSAje2RhdGEubG9uZ2l0dWRlfVwiXG4gICAgICAgICAgICBpbmZvV2luZG93OlxuICAgICAgICAgICAgICBjb250ZW50OiBcIiN7ZGF0YS5sYXRpdHVkZX0gI3tkYXRhLmxvbmdpdHVkZX1cIlxuICAgICAgICAgICAgXG4gICAgICAgICQoJy5nb3ZtYXAtZm91bmQnKS5odG1sIFwiPHN0cm9uZz5GT1VORDogPC9zdHJvbmc+I3tyZXN1bHRzWzBdLmZvcm1hdHRlZF9hZGRyZXNzfVwiXG4gICAgICByZXR1cm5cblxuXG5jbGVhcj0ocyktPlxuICByZXR1cm4gaWYgcy5tYXRjaCgvIGJveCAvaSkgdGhlbiAnJyBlbHNlIHNcblxuZ2VvY29kZSA9IChkYXRhKSAtPlxuICBhZGRyID0gXCIje2NsZWFyKGRhdGEuYWRkcmVzczEpfSAje2NsZWFyKGRhdGEuYWRkcmVzczIpfSwgI3tkYXRhLmNpdHl9LCAje2RhdGEuc3RhdGV9ICN7ZGF0YS56aXB9LCBVU0FcIlxuICAkKCcjZ292YWRkcmVzcycpLnZhbChhZGRyKVxuICBnZW9jb2RlX2FkZHIgYWRkciwgZGF0YVxuXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgZ2VvY29kZTogZ2VvY29kZVxuICBnb2NvZGVfYWRkcjogZ2VvY29kZV9hZGRyXG4gIG9uX2JvdW5kc19jaGFuZ2VkOiBvbl9ib3VuZHNfY2hhbmdlZFxuICBvbl9ib3VuZHNfY2hhbmdlZF9sYXRlcjogb25fYm91bmRzX2NoYW5nZWRfbGF0ZXJcbiIsIlxucXVlcnlfbWF0Y2hlciA9IHJlcXVpcmUoJy4vcXVlcnltYXRjaGVyLmNvZmZlZScpXG5cbmNsYXNzIEdvdlNlbGVjdG9yXG4gIFxuICAjIHN0dWIgb2YgYSBjYWxsYmFjayB0byBlbnZva2Ugd2hlbiB0aGUgdXNlciBzZWxlY3RzIHNvbWV0aGluZ1xuICBvbl9zZWxlY3RlZDogKGV2dCwgZGF0YSwgbmFtZSkgLT5cblxuXG4gIGNvbnN0cnVjdG9yOiAoQGh0bWxfc2VsZWN0b3IsIGRvY3NfdXJsLCBAbnVtX2l0ZW1zKSAtPlxuICAgICQuYWpheFxuICAgICAgdXJsOiBkb2NzX3VybFxuICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgY2FjaGU6IHRydWVcbiAgICAgIHN1Y2Nlc3M6IEBzdGFydFN1Z2dlc3Rpb25cbiAgICAgIFxuXG5cblxuICBzdWdnZXN0aW9uVGVtcGxhdGUgOiBIYW5kbGViYXJzLmNvbXBpbGUoXCJcIlwiXG4gICAgPGRpdiBjbGFzcz1cInN1Z2ctYm94XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwic3VnZy1zdGF0ZVwiPnt7e3N0YXRlfX19PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwic3VnZy1uYW1lXCI+e3t7Z292X25hbWV9fX08L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJzdWdnLXR5cGVcIj57e3tnb3ZfdHlwZX19fTwvZGl2PlxuICAgIDwvZGl2PlwiXCJcIilcblxuXG5cbiAgZW50ZXJlZF92YWx1ZSA9IFwiXCJcblxuICBnb3ZzX2FycmF5ID0gW11cblxuICBjb3VudF9nb3ZzIDogKCkgLT5cbiAgICBjb3VudCA9MFxuICAgIGZvciBkIGluIEBnb3ZzX2FycmF5XG4gICAgICBpZiBHT1ZXSUtJLnN0YXRlX2ZpbHRlciBhbmQgZC5zdGF0ZSBpc250IEdPVldJS0kuc3RhdGVfZmlsdGVyIHRoZW4gY29udGludWVcbiAgICAgIGlmIEdPVldJS0kuZ292X3R5cGVfZmlsdGVyIGFuZCBkLmdvdl90eXBlIGlzbnQgR09WV0lLSS5nb3ZfdHlwZV9maWx0ZXIgdGhlbiBjb250aW51ZVxuICAgICAgY291bnQrK1xuICAgIHJldHVybiBjb3VudFxuXG5cbiAgc3RhcnRTdWdnZXN0aW9uIDogKGdvdnMpID0+XG4gICAgI0Bnb3ZzX2FycmF5ID0gZ292c1xuICAgIEBnb3ZzX2FycmF5ID0gZ292cy5yZWNvcmRcbiAgICAkKCcudHlwZWFoZWFkJykua2V5dXAgKGV2ZW50KSA9PlxuICAgICAgQGVudGVyZWRfdmFsdWUgPSAkKGV2ZW50LnRhcmdldCkudmFsKClcbiAgICBcbiAgICAkKEBodG1sX3NlbGVjdG9yKS5hdHRyICdwbGFjZWhvbGRlcicsICdHT1ZFUk5NRU5UIE5BTUUnXG4gICAgJChAaHRtbF9zZWxlY3RvcikudHlwZWFoZWFkKFxuICAgICAgICBoaW50OiBmYWxzZVxuICAgICAgICBoaWdobGlnaHQ6IGZhbHNlXG4gICAgICAgIG1pbkxlbmd0aDogMVxuICAgICAgICBjbGFzc05hbWVzOlxuICAgICAgICBcdG1lbnU6ICd0dC1kcm9wZG93bi1tZW51J1xuICAgICAgLFxuICAgICAgICBuYW1lOiAnZ292X25hbWUnXG4gICAgICAgIGRpc3BsYXlLZXk6ICdnb3ZfbmFtZSdcbiAgICAgICAgc291cmNlOiBxdWVyeV9tYXRjaGVyKEBnb3ZzX2FycmF5LCBAbnVtX2l0ZW1zKVxuICAgICAgICAjc291cmNlOiBibG9vZGhvdW5kLnR0QWRhcHRlcigpXG4gICAgICAgIHRlbXBsYXRlczogc3VnZ2VzdGlvbjogQHN1Z2dlc3Rpb25UZW1wbGF0ZVxuICAgIClcbiAgICAub24gJ3R5cGVhaGVhZDpzZWxlY3RlZCcsICAoZXZ0LCBkYXRhLCBuYW1lKSA9PlxuICAgICAgICAkKCcudHlwZWFoZWFkJykudHlwZWFoZWFkICd2YWwnLCBAZW50ZXJlZF92YWx1ZVxuICAgICAgICBAb25fc2VsZWN0ZWQoZXZ0LCBkYXRhLCBuYW1lKVxuICAgXG4gICAgLm9uICd0eXBlYWhlYWQ6Y3Vyc29yY2hhbmdlZCcsIChldnQsIGRhdGEsIG5hbWUpID0+XG4gICAgICAgICQoJy50eXBlYWhlYWQnKS52YWwgQGVudGVyZWRfdmFsdWVcbiAgICBcblxuICAgICQoJy5nb3YtY291bnRlcicpLnRleHQgQGNvdW50X2dvdnMoKVxuICAgIHJldHVyblxuXG5cblxuXG5cbm1vZHVsZS5leHBvcnRzPUdvdlNlbGVjdG9yXG5cblxuXG4iLCIjIyNcbmZpbGU6IG1haW4uY29mZmUgLS0gVGhlIGVudHJ5IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIDpcbmdvdl9maW5kZXIgPSBuZXcgR292RmluZGVyXG5nb3ZfZGV0YWlscyA9IG5ldyBHb3ZEZXRhaWxzXG5nb3ZfZmluZGVyLm9uX3NlbGVjdCA9IGdvdl9kZXRhaWxzLnNob3dcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIyNcblxuR292U2VsZWN0b3IgPSByZXF1aXJlICcuL2dvdnNlbGVjdG9yLmNvZmZlZSdcbiNfanFncyAgICAgICA9IHJlcXVpcmUgJy4vanF1ZXJ5LmdvdnNlbGVjdG9yLmNvZmZlZSdcblRlbXBsYXRlczIgICAgICA9IHJlcXVpcmUgJy4vdGVtcGxhdGVzMi5jb2ZmZWUnXG5nb3ZtYXAgICAgICA9IHJlcXVpcmUgJy4vZ292bWFwLmNvZmZlZSdcbiNzY3JvbGx0byA9IHJlcXVpcmUgJy4uL2Jvd2VyX2NvbXBvbmVudHMvanF1ZXJ5LnNjcm9sbFRvL2pxdWVyeS5zY3JvbGxUby5qcydcblxud2luZG93LkdPVldJS0kgPVxuICBzdGF0ZV9maWx0ZXIgOiAnJ1xuICBnb3ZfdHlwZV9maWx0ZXIgOiAnJ1xuXG4gIHNob3dfc2VhcmNoX3BhZ2U6ICgpIC0+XG4gICAgJCh3aW5kb3cpLnNjcm9sbFRvKCcwcHgnLDEwKVxuICAgICQoJyNkYXRhQ29udGFpbmVyJykuaGlkZSgpXG4gICAgJCgnI3NlYXJjaEljb24nKS5oaWRlKClcbiAgICAkKCcjc2VhcmNoQ29udGFpbmVyJykuZmFkZUluKDMwMClcbiAgICBmb2N1c19zZWFyY2hfZmllbGQgNTAwXG4gICAgXG4gIHNob3dfZGF0YV9wYWdlOiAoKSAtPlxuICAgICQod2luZG93KS5zY3JvbGxUbygnMHB4JywxMClcbiAgICAkKCcjc2VhcmNoSWNvbicpLnNob3coKVxuICAgICQoJyNkYXRhQ29udGFpbmVyJykuZmFkZUluKDMwMClcbiAgICAkKCcjc2VhcmNoQ29udGFpbmVyJykuaGlkZSgpXG4gICAgIyQod2luZG93KS5zY3JvbGxUbygnI3BCYWNrVG9TZWFyY2gnLDYwMClcblxuXG5cblxuI2dvdl9zZWxlY3RvciA9IG5ldyBHb3ZTZWxlY3RvciAnLnR5cGVhaGVhZCcsICdkYXRhL2hfdHlwZXMuanNvbicsIDdcbmdvdl9zZWxlY3RvciA9IG5ldyBHb3ZTZWxlY3RvciAnLnR5cGVhaGVhZCcsICdkYXRhL2hfdHlwZXNfY2EuanNvbicsIDdcbiNnb3Zfc2VsZWN0b3IgPSBuZXcgR292U2VsZWN0b3IgJy50eXBlYWhlYWQnLCAnaHR0cDovLzQ2LjEwMS4zLjc5L3Jlc3QvZGIvZ292cz9maWx0ZXI9c3RhdGU9JTIyQ0ElMjImYXBwX25hbWU9Z292d2lraSZmaWVsZHM9X2lkLGdvdl9uYW1lLGdvdl90eXBlLHN0YXRlJmxpbWl0PTUwMDAnLCA3XG50ZW1wbGF0ZXMgPSBuZXcgVGVtcGxhdGVzMlxuYWN0aXZlX3RhYj1cIlwiIFxuXG4jXCJcblxuIyBmaXJlIGNsaWVudC1zaWRlIFVSTCByb3V0aW5nXG5yb3V0ZXIgPSBuZXcgR3JhcG5lbFxucm91dGVyLmdldCAnOmlkJywgKHJlcSkgLT4gXG4gIGlkID0gcmVxLnBhcmFtcy5pZFxuICBjb25zb2xlLmxvZyBcIlJPVVRFUiBJRD0je2lkfVwiXG4gIGdldF9lbGVjdGVkX29mZmljaWFscyA9IChnb3ZfaWQsIGxpbWl0LCBvbnN1Y2Nlc3MpIC0+XG4gICAgJC5hamF4XG4gICAgICB1cmw6XCJodHRwOi8vNDYuMTAxLjMuNzk6ODAvcmVzdC9kYi9lbGVjdGVkX29mZmljaWFsc1wiXG4gICAgICBkYXRhOlxuICAgICAgICBmaWx0ZXI6XCJnb3ZzX2lkPVwiICsgZ292X2lkXG4gICAgICAgIGZpZWxkczpcImdvdnNfaWQsdGl0bGUsZnVsbF9uYW1lLGVtYWlsX2FkZHJlc3MscGhvdG9fdXJsLHRlcm1fZXhwaXJlc1wiXG4gICAgICAgIGFwcF9uYW1lOlwiZ292d2lraVwiXG4gICAgICAgIG9yZGVyOlwiZGlzcGxheV9vcmRlclwiXG4gICAgICAgIGxpbWl0OmxpbWl0XG5cbiAgICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICAgIGNhY2hlOiB0cnVlXG4gICAgICBzdWNjZXNzOiBvbnN1Y2Nlc3NcbiAgICAgIGVycm9yOihlKSAtPlxuICAgICAgICBjb25zb2xlLmxvZyBlXG5cbiAgZWxlY3RlZF9vZmZpY2lhbHMgPSBnZXRfZWxlY3RlZF9vZmZpY2lhbHMgaWQsIDI1LCAoZWxlY3RlZF9vZmZpY2lhbHNfZGF0YSwgdGV4dFN0YXR1cywganFYSFIpIC0+XG4gICAgZGF0YSA9IG5ldyBPYmplY3QoKVxuICAgIGRhdGEuX2lkID0gaWRcbiAgICBkYXRhLmVsZWN0ZWRfb2ZmaWNpYWxzID0gZWxlY3RlZF9vZmZpY2lhbHNfZGF0YVxuICAgIGRhdGEuZ292X25hbWUgPSBcIlwiXG4gICAgZGF0YS5nb3ZfdHlwZSA9IFwiXCJcbiAgICBkYXRhLnN0YXRlID0gXCJcIlxuICAgICQoJyNkZXRhaWxzJykuaHRtbCB0ZW1wbGF0ZXMuZ2V0X2h0bWwoMCwgZGF0YSlcbiAgICBnZXRfcmVjb3JkMiBkYXRhLl9pZFxuICAgIGFjdGl2YXRlX3RhYigpXG4gICAgR09WV0lLSS5zaG93X2RhdGFfcGFnZSgpXG4gICAgcmV0dXJuXG5cblxuXG5cbndpbmRvdy5yZW1lbWJlcl90YWIgPShuYW1lKS0+IGFjdGl2ZV90YWIgPSBuYW1lXG5cbiN3aW5kb3cuZ2VvY29kZV9hZGRyID0gKGlucHV0X3NlbGVjdG9yKS0+IGdvdm1hcC5nb2NvZGVfYWRkciAkKGlucHV0X3NlbGVjdG9yKS52YWwoKVxuXG4kKGRvY3VtZW50KS5vbiAnY2xpY2snLCAnI2ZpZWxkVGFicyBhJywgKGUpIC0+XG4gIGFjdGl2ZV90YWIgPSAkKGUuY3VycmVudFRhcmdldCkuZGF0YSgndGFibmFtZScpXG4gIGNvbnNvbGUubG9nIGFjdGl2ZV90YWJcbiAgJChcIiN0YWJzQ29udGVudCAudGFiLXBhbmVcIikucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIilcbiAgJCgkKGUuY3VycmVudFRhcmdldCkuYXR0cignaHJlZicpKS5hZGRDbGFzcyhcImFjdGl2ZVwiKVxuICB0ZW1wbGF0ZXMuYWN0aXZhdGUgMCwgYWN0aXZlX3RhYlxuXG4kKGRvY3VtZW50KS5vbiAnY2xpY2snLCAoZSkgLT5cbiAgICAgJCgnW2RhdGEtdG9nZ2xlPVwidG9vbHRpcFwiXScpLnRvb2x0aXAoKVxuXG5hY3RpdmF0ZV90YWIgPSgpIC0+XG4gICQoXCIjZmllbGRUYWJzIGFbaHJlZj0nI3RhYiN7YWN0aXZlX3RhYn0nXVwiKS50YWIoJ3Nob3cnKVxuXG5nb3Zfc2VsZWN0b3Iub25fc2VsZWN0ZWQgPSAoZXZ0LCBkYXRhLCBuYW1lKSAtPlxuICAjcmVuZGVyRGF0YSAnI2RldGFpbHMnLCBkYXRhXG4gIGdldF9lbGVjdGVkX29mZmljaWFscyBkYXRhLl9pZCwgMjUsIChkYXRhMiwgdGV4dFN0YXR1cywganFYSFIpIC0+XG4gICAgZGF0YS5lbGVjdGVkX29mZmljaWFscyA9IGRhdGEyXG4gICAgJCgnI2RldGFpbHMnKS5odG1sIHRlbXBsYXRlcy5nZXRfaHRtbCgwLCBkYXRhKVxuICAgICNnZXRfcmVjb3JkIFwiaW5jX2lkOiN7ZGF0YVtcImluY19pZFwiXX1cIlxuICAgIGdldF9yZWNvcmQyIGRhdGFbXCJfaWRcIl1cbiAgICBhY3RpdmF0ZV90YWIoKVxuICAgIEdPVldJS0kuc2hvd19kYXRhX3BhZ2UoKVxuICAgIHJvdXRlci5uYXZpZ2F0ZShkYXRhLl9pZClcbiAgICByZXR1cm5cblxuXG5nZXRfcmVjb3JkID0gKHF1ZXJ5KSAtPlxuICAkLmFqYXhcbiAgICB1cmw6IFwiaHR0cHM6Ly9hcGkubW9uZ29sYWIuY29tL2FwaS8xL2RhdGFiYXNlcy9nb3Z3aWtpL2NvbGxlY3Rpb25zL2dvdnMvP3E9eyN7cXVlcnl9fSZmPXtfaWQ6MH0mbD0xJmFwaUtleT0wWTVYX1FrMnVPSlJkSEpXSktTUldrNmw2SnFWVFMyeVwiXG4gICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgIGNhY2hlOiB0cnVlXG4gICAgc3VjY2VzczogKGRhdGEpIC0+XG4gICAgICBpZiBkYXRhLmxlbmd0aFxuICAgICAgICAkKCcjZGV0YWlscycpLmh0bWwgdGVtcGxhdGVzLmdldF9odG1sKDAsIGRhdGFbMF0pXG4gICAgICAgIGFjdGl2YXRlX3RhYigpXG4gICAgICAgICNnb3ZtYXAuZ2VvY29kZSBkYXRhWzBdXG4gICAgICByZXR1cm5cbiAgICBlcnJvcjooZSkgLT5cbiAgICAgIGNvbnNvbGUubG9nIGVcblxuXG5nZXRfcmVjb3JkMiA9IChyZWNpZCkgLT5cbiAgJC5hamF4XG4gICAgI3VybDogXCJodHRwczovL2RzcC1nb3Z3aWtpLmNsb3VkLmRyZWFtZmFjdG9yeS5jb206NDQzL3Jlc3QvZ292d2lraV9hcGkvZ292cy8je3JlY2lkfVwiXG4gICAgdXJsOiBcImh0dHA6Ly80Ni4xMDEuMy43OTo4MC9yZXN0L2RiL2dvdnMvI3tyZWNpZH1cIlxuICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICBoZWFkZXJzOiB7XCJYLURyZWFtRmFjdG9yeS1BcHBsaWNhdGlvbi1OYW1lXCI6XCJnb3Z3aWtpXCJ9XG4gICAgY2FjaGU6IHRydWVcbiAgICBzdWNjZXNzOiAoZGF0YSkgLT5cbiAgICAgIGlmIGRhdGFcbiAgICAgICAgZ2V0X2ZpbmFuY2lhbF9zdGF0ZW1lbnRzIGRhdGEuX2lkLCAoZGF0YTIsIHRleHRTdGF0dXMsIGpxWEhSKSAtPlxuICAgICAgICAgIGRhdGEuZmluYW5jaWFsX3N0YXRlbWVudHMgPSBkYXRhMlxuICAgICAgICAgIGdldF9lbGVjdGVkX29mZmljaWFscyBkYXRhLl9pZCwgMjUsIChkYXRhMywgdGV4dFN0YXR1czIsIGpxWEhSMikgLT5cbiAgICAgICAgICAgIGRhdGEuZWxlY3RlZF9vZmZpY2lhbHMgPSBkYXRhM1xuICAgICAgICAgICAgJCgnI2RldGFpbHMnKS5odG1sIHRlbXBsYXRlcy5nZXRfaHRtbCgwLCBkYXRhKVxuICAgICAgICAgICAgYWN0aXZhdGVfdGFiKClcbiAgICAgICAgICAgICNnb3ZtYXAuZ2VvY29kZSBkYXRhWzBdXG4gICAgICByZXR1cm5cbiAgICBlcnJvcjooZSkgLT5cbiAgICAgIGNvbnNvbGUubG9nIGVcblxuXG5nZXRfZWxlY3RlZF9vZmZpY2lhbHMgPSAoZ292X2lkLCBsaW1pdCwgb25zdWNjZXNzKSAtPlxuICAkLmFqYXhcbiAgICB1cmw6XCJodHRwOi8vNDYuMTAxLjMuNzk6ODAvcmVzdC9kYi9lbGVjdGVkX29mZmljaWFsc1wiXG4gICAgZGF0YTpcbiAgICAgIGZpbHRlcjpcImdvdnNfaWQ9XCIgKyBnb3ZfaWRcbiAgICAgIGZpZWxkczpcImdvdnNfaWQsdGl0bGUsZnVsbF9uYW1lLGVtYWlsX2FkZHJlc3MscGhvdG9fdXJsLHRlcm1fZXhwaXJlcyx0ZWxlcGhvbmVfbnVtYmVyXCJcbiAgICAgIGFwcF9uYW1lOlwiZ292d2lraVwiXG4gICAgICBvcmRlcjpcImRpc3BsYXlfb3JkZXJcIlxuICAgICAgbGltaXQ6bGltaXRcblxuICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICBjYWNoZTogdHJ1ZVxuICAgIHN1Y2Nlc3M6IG9uc3VjY2Vzc1xuICAgIGVycm9yOihlKSAtPlxuICAgICAgY29uc29sZS5sb2cgZVxuXG5nZXRfZmluYW5jaWFsX3N0YXRlbWVudHMgPSAoZ292X2lkLCBvbnN1Y2Nlc3MpIC0+XG4gICQuYWpheFxuICAgIHVybDpcImh0dHA6Ly80Ni4xMDEuMy43OTo4MC9yZXN0L2RiL19wcm9jL2dldF9maW5hbmNpYWxfc3RhdGVtZW50c1wiXG4gICAgZGF0YTpcbiAgICAgIGFwcF9uYW1lOlwiZ292d2lraVwiXG4gICAgICBvcmRlcjpcImNhcHRpb25fY2F0ZWdvcnksZGlzcGxheV9vcmRlclwiXG4gICAgICBwYXJhbXM6IFtcbiAgICAgICAgbmFtZTogXCJnb3ZzX2lkXCJcbiAgICAgICAgcGFyYW1fdHlwZTogXCJJTlwiXG4gICAgICAgIHZhbHVlOiBnb3ZfaWRcbiAgICAgIF1cblxuICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICBjYWNoZTogdHJ1ZVxuICAgIHN1Y2Nlc3M6IG9uc3VjY2Vzc1xuICAgIGVycm9yOihlKSAtPlxuICAgICAgY29uc29sZS5sb2cgZVxuICBcblxud2luZG93LkdPVldJS0kuc2hvd19yZWNvcmQgPShyZWMpPT5cbiAgJCgnI2RldGFpbHMnKS5odG1sIHRlbXBsYXRlcy5nZXRfaHRtbCgwLCByZWMpXG4gIGFjdGl2YXRlX3RhYigpXG4gIEdPVldJS0kuc2hvd19kYXRhX3BhZ2UoKVxuICByb3V0ZXIubmF2aWdhdGUocmVjLl9pZClcblxuXG53aW5kb3cuR09WV0lLSS5zaG93X3JlY29yZDIgPShyZWMpPT5cbiAgZ2V0X2VsZWN0ZWRfb2ZmaWNpYWxzIHJlYy5faWQsIDI1LCAoZGF0YSwgdGV4dFN0YXR1cywganFYSFIpIC0+XG4gICAgcmVjLmVsZWN0ZWRfb2ZmaWNpYWxzID0gZGF0YVxuICAgICQoJyNkZXRhaWxzJykuaHRtbCB0ZW1wbGF0ZXMuZ2V0X2h0bWwoMCwgcmVjKVxuICAgIGdldF9yZWNvcmQyIHJlYy5faWRcbiAgICBhY3RpdmF0ZV90YWIoKVxuICAgIEdPVldJS0kuc2hvd19kYXRhX3BhZ2UoKVxuICAgIHJvdXRlci5uYXZpZ2F0ZShyZWMuX2lkKVxuXG5cblxuIyMjXG53aW5kb3cuc2hvd19yZWMgPSAocmVjKS0+XG4gICQoJyNkZXRhaWxzJykuaHRtbCB0ZW1wbGF0ZXMuZ2V0X2h0bWwoMCwgcmVjKVxuICBhY3RpdmF0ZV90YWIoKVxuIyMjXG5cbmJ1aWxkX3NlbGVjdG9yID0gKGNvbnRhaW5lciwgdGV4dCwgY29tbWFuZCwgd2hlcmVfdG9fc3RvcmVfdmFsdWUgKSAtPlxuICAkLmFqYXhcbiAgICB1cmw6ICdodHRwczovL2FwaS5tb25nb2xhYi5jb20vYXBpLzEvZGF0YWJhc2VzL2dvdndpa2kvcnVuQ29tbWFuZD9hcGlLZXk9MFk1WF9RazJ1T0pSZEhKV0pLU1JXazZsNkpxVlRTMnknXG4gICAgdHlwZTogJ1BPU1QnXG4gICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvblwiXG4gICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgIGRhdGE6IGNvbW1hbmQgI0pTT04uc3RyaW5naWZ5KGNvbW1hbmQpXG4gICAgY2FjaGU6IHRydWVcbiAgICBzdWNjZXNzOiAoZGF0YSkgPT5cbiAgICAgICNhPSQuZXh0ZW5kIHRydWUgW10sZGF0YVxuICAgICAgdmFsdWVzPWRhdGEudmFsdWVzXG4gICAgICBidWlsZF9zZWxlY3RfZWxlbWVudCBjb250YWluZXIsIHRleHQsIHZhbHVlcy5zb3J0KCksIHdoZXJlX3RvX3N0b3JlX3ZhbHVlXG4gICAgICByZXR1cm5cbiAgICBlcnJvcjooZSkgLT5cbiAgICAgIGNvbnNvbGUubG9nIGVcblxuXG5idWlsZF9zZWxlY3RfZWxlbWVudCA9IChjb250YWluZXIsIHRleHQsIGFyciwgd2hlcmVfdG9fc3RvcmVfdmFsdWUgKSAtPlxuICBzICA9IFwiPHNlbGVjdCBjbGFzcz0nZm9ybS1jb250cm9sJyBzdHlsZT0nbWF4d2lkdGg6MTYwcHg7Jz48b3B0aW9uIHZhbHVlPScnPiN7dGV4dH08L29wdGlvbj5cIlxuICBzICs9IFwiPG9wdGlvbiB2YWx1ZT0nI3t2fSc+I3t2fTwvb3B0aW9uPlwiIGZvciB2IGluIGFyciB3aGVuIHZcbiAgcyArPSBcIjwvc2VsZWN0PlwiXG4gIHNlbGVjdCA9ICQocylcbiAgJChjb250YWluZXIpLmFwcGVuZChzZWxlY3QpXG4gIFxuICAjIHNldCBkZWZhdWx0ICdDQSdcbiAgaWYgdGV4dCBpcyAnU3RhdGUuLidcbiAgICBzZWxlY3QudmFsICdDQSdcbiAgICB3aW5kb3cuR09WV0lLSS5zdGF0ZV9maWx0ZXI9J0NBJ1xuICAgIGdvdm1hcC5vbl9ib3VuZHNfY2hhbmdlZF9sYXRlcigpXG5cbiAgc2VsZWN0LmNoYW5nZSAoZSkgLT5cbiAgICBlbCA9ICQoZS50YXJnZXQpXG4gICAgd2luZG93LkdPVldJS0lbd2hlcmVfdG9fc3RvcmVfdmFsdWVdID0gZWwudmFsKClcbiAgICAkKCcuZ292LWNvdW50ZXInKS50ZXh0IGdvdl9zZWxlY3Rvci5jb3VudF9nb3ZzKClcbiAgICBnb3ZtYXAub25fYm91bmRzX2NoYW5nZWQoKVxuXG5cbmFkanVzdF90eXBlYWhlYWRfd2lkdGggPSgpIC0+XG4gIGlucCA9ICQoJyNteWlucHV0JylcbiAgcGFyID0gJCgnI3R5cGVhaGVkLWNvbnRhaW5lcicpXG4gIGlucC53aWR0aCBwYXIud2lkdGgoKVxuXG5cblxuXG5zdGFydF9hZGp1c3RpbmdfdHlwZWFoZWFkX3dpZHRoID0oKSAtPlxuICAkKHdpbmRvdykucmVzaXplIC0+XG4gICAgYWRqdXN0X3R5cGVhaGVhZF93aWR0aCgpXG5cblxuIyBhZGQgbGl2ZSByZWxvYWQgdG8gdGhlIHNpdGUuIEZvciBkZXZlbG9wbWVudCBvbmx5LlxubGl2ZXJlbG9hZCA9IChwb3J0KSAtPlxuICB1cmw9d2luZG93LmxvY2F0aW9uLm9yaWdpbi5yZXBsYWNlIC86W146XSokLywgXCJcIlxuICAkLmdldFNjcmlwdCB1cmwgKyBcIjpcIiArIHBvcnQsID0+XG4gICAgJCgnYm9keScpLmFwcGVuZCBcIlwiXCJcbiAgICA8ZGl2IHN0eWxlPSdwb3NpdGlvbjphYnNvbHV0ZTt6LWluZGV4OjEwMDA7XG4gICAgd2lkdGg6MTAwJTsgdG9wOjA7Y29sb3I6cmVkOyB0ZXh0LWFsaWduOiBjZW50ZXI7IFxuICAgIHBhZGRpbmc6MXB4O2ZvbnQtc2l6ZToxMHB4O2xpbmUtaGVpZ2h0OjEnPmxpdmU8L2Rpdj5cbiAgICBcIlwiXCJcblxuZm9jdXNfc2VhcmNoX2ZpZWxkID0gKG1zZWMpIC0+XG4gIHNldFRpbWVvdXQgKC0+ICQoJyNteWlucHV0JykuZm9jdXMoKSkgLG1zZWNcblxuXG4gIFxuIyBxdWljayBhbmQgZGlydHkgZml4IGZvciBiYWNrIGJ1dHRvbiBpbiBicm93c2VyXG53aW5kb3cub25oYXNoY2hhbmdlID0gKGUpIC0+XG4gIGg9d2luZG93LmxvY2F0aW9uLmhhc2hcbiAgI2NvbnNvbGUubG9nIFwib25IYXNoQ2hhbmdlICN7aH1cIlxuICAjY29uc29sZS5sb2cgZVxuICBpZiBub3QgaFxuICAgIEdPVldJS0kuc2hvd19zZWFyY2hfcGFnZSgpXG5cbiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiN0ZW1wbGF0ZXMubG9hZF90ZW1wbGF0ZSBcInRhYnNcIiwgXCJjb25maWcvdGFibGF5b3V0Lmpzb25cIlxudGVtcGxhdGVzLmxvYWRfZnVzaW9uX3RlbXBsYXRlIFwidGFic1wiLCBcImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL2Z1c2lvbnRhYmxlcy92Mi9xdWVyeT9zcWw9U0VMRUNUJTIwKiUyMEZST00lMjAxejJvWFFFWVEzcDJPb01JOFY1Z0tnSFdCNVR6OTkwQnJRMXhjMXRWbyZrZXk9QUl6YVN5Q1hEUXlNRHBHQTJnM1FqdXY0Q0R2N3pSai1peDRJUUpBXCJcblxuYnVpbGRfc2VsZWN0b3IoJy5zdGF0ZS1jb250YWluZXInICwgJ1N0YXRlLi4nICwgJ3tcImRpc3RpbmN0XCI6IFwiZ292c1wiLFwia2V5XCI6XCJzdGF0ZVwifScgLCAnc3RhdGVfZmlsdGVyJylcbmJ1aWxkX3NlbGVjdG9yKCcuZ292LXR5cGUtY29udGFpbmVyJyAsICd0eXBlIG9mIGdvdmVybm1lbnQuLicgLCAne1wiZGlzdGluY3RcIjogXCJnb3ZzXCIsXCJrZXlcIjpcImdvdl90eXBlXCJ9JyAsICdnb3ZfdHlwZV9maWx0ZXInKVxuXG5hZGp1c3RfdHlwZWFoZWFkX3dpZHRoKClcbnN0YXJ0X2FkanVzdGluZ190eXBlYWhlYWRfd2lkdGgoKVxuXG4kKCcjYnRuQmFja1RvU2VhcmNoJykuY2xpY2sgKGUpLT5cbiAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gIEdPVldJS0kuc2hvd19zZWFyY2hfcGFnZSgpXG5cbiNmb2N1c19zZWFyY2hfZmllbGQgNTAwXG5cbiAgXG5cbmxpdmVyZWxvYWQgXCI5MDkwXCJcblxuIiwiXG5cblxuIyBUYWtlcyBhbiBhcnJheSBvZiBkb2NzIHRvIHNlYXJjaCBpbi5cbiMgUmV0dXJucyBhIGZ1bmN0aW9ucyB0aGF0IHRha2VzIDIgcGFyYW1zIFxuIyBxIC0gcXVlcnkgc3RyaW5nIGFuZCBcbiMgY2IgLSBjYWxsYmFjayB0aGF0IHdpbGwgYmUgY2FsbGVkIHdoZW4gdGhlIHNlYXJjaCBpcyBkb25lLlxuIyBjYiByZXR1cm5zIGFuIGFycmF5IG9mIG1hdGNoaW5nIGRvY3VtZW50cy5cbiMgbXVtX2l0ZW1zIC0gbWF4IG51bWJlciBvZiBmb3VuZCBpdGVtcyB0byBzaG93XG5RdWVyeU1hdGhlciA9IChkb2NzLCBudW1faXRlbXM9NSkgLT5cbiAgKHEsIGNiKSAtPlxuICAgIHRlc3Rfc3RyaW5nID0ocywgcmVncykgLT5cbiAgICAgIChpZiBub3Qgci50ZXN0KHMpIHRoZW4gcmV0dXJuIGZhbHNlKSAgZm9yIHIgaW4gcmVnc1xuICAgICAgcmV0dXJuIHRydWVcblxuICAgIFt3b3JkcyxyZWdzXSA9IGdldF93b3Jkc19yZWdzIHFcbiAgICBtYXRjaGVzID0gW11cbiAgICAjIGl0ZXJhdGUgdGhyb3VnaCB0aGUgcG9vbCBvZiBkb2NzIGFuZCBmb3IgYW55IHN0cmluZyB0aGF0XG4gICAgIyBjb250YWlucyB0aGUgc3Vic3RyaW5nIGBxYCwgYWRkIGl0IHRvIHRoZSBgbWF0Y2hlc2AgYXJyYXlcblxuICAgIGZvciBkIGluIGRvY3NcbiAgICAgIGlmIG1hdGNoZXMubGVuZ3RoID49IG51bV9pdGVtcyB0aGVuIGJyZWFrXG4gICAgICBpZiBHT1ZXSUtJLnN0YXRlX2ZpbHRlciBhbmQgZC5zdGF0ZSBpc250IEdPVldJS0kuc3RhdGVfZmlsdGVyIHRoZW4gY29udGludWVcbiAgICAgIGlmIEdPVldJS0kuZ292X3R5cGVfZmlsdGVyIGFuZCBkLmdvdl90eXBlIGlzbnQgR09WV0lLSS5nb3ZfdHlwZV9maWx0ZXIgdGhlbiBjb250aW51ZVxuXG4gICAgICBpZiB0ZXN0X3N0cmluZyhkLmdvdl9uYW1lLCByZWdzKSBcbiAgICAgICAgbWF0Y2hlcy5wdXNoICQuZXh0ZW5kKHt9LCBkKVxuICAgICAgI2lmIHRlc3Rfc3RyaW5nKFwiI3tkLmdvdl9uYW1lfSAje2Quc3RhdGV9ICN7ZC5nb3ZfdHlwZX0gI3tkLmluY19pZH1cIiwgcmVncykgdGhlbiBtYXRjaGVzLnB1c2ggJC5leHRlbmQoe30sIGQpXG4gICAgXG4gICAgc2VsZWN0X3RleHQgbWF0Y2hlcywgd29yZHMsIHJlZ3NcbiAgICBjYiBtYXRjaGVzXG4gICAgcmV0dXJuXG4gXG5cbiMgaW5zZXJ0cyA8c3Ryb25nPiBlbGVtZW50c2UgaW4gYXJyYXlcbnNlbGVjdF90ZXh0ID0gKGNsb25lcyx3b3JkcyxyZWdzKSAtPlxuICBmb3IgZCBpbiBjbG9uZXNcbiAgICBkLmdvdl9uYW1lPXN0cm9uZ2lmeShkLmdvdl9uYW1lLCB3b3JkcywgcmVncylcbiAgICAjZC5zdGF0ZT1zdHJvbmdpZnkoZC5zdGF0ZSwgd29yZHMsIHJlZ3MpXG4gICAgI2QuZ292X3R5cGU9c3Ryb25naWZ5KGQuZ292X3R5cGUsIHdvcmRzLCByZWdzKVxuICBcbiAgcmV0dXJuIGNsb25lc1xuXG5cblxuIyBpbnNlcnRzIDxzdHJvbmc+IGVsZW1lbnRzZVxuc3Ryb25naWZ5ID0gKHMsIHdvcmRzLCByZWdzKSAtPlxuICByZWdzLmZvckVhY2ggKHIsaSkgLT5cbiAgICBzID0gcy5yZXBsYWNlIHIsIFwiPGI+I3t3b3Jkc1tpXX08L2I+XCJcbiAgcmV0dXJuIHNcblxuIyByZW1vdmVzIDw+IHRhZ3MgZnJvbSBhIHN0cmluZ1xuc3RyaXAgPSAocykgLT5cbiAgcy5yZXBsYWNlKC88W148Pl0qPi9nLCcnKVxuXG5cbiMgYWxsIHRpcm1zIHNwYWNlcyBmcm9tIGJvdGggc2lkZXMgYW5kIG1ha2UgY29udHJhY3RzIHNlcXVlbmNlcyBvZiBzcGFjZXMgdG8gMVxuZnVsbF90cmltID0gKHMpIC0+XG4gIHNzPXMudHJpbSgnJytzKVxuICBzcz1zcy5yZXBsYWNlKC8gKy9nLCcgJylcblxuIyByZXR1cm5zIGFuIGFycmF5IG9mIHdvcmRzIGluIGEgc3RyaW5nXG5nZXRfd29yZHMgPSAoc3RyKSAtPlxuICBmdWxsX3RyaW0oc3RyKS5zcGxpdCgnICcpXG5cblxuZ2V0X3dvcmRzX3JlZ3MgPSAoc3RyKSAtPlxuICB3b3JkcyA9IGdldF93b3JkcyBzdHJcbiAgcmVncyA9IHdvcmRzLm1hcCAodyktPiBuZXcgUmVnRXhwKFwiI3t3fVwiLCdpJylcbiAgW3dvcmRzLHJlZ3NdXG5cblxubW9kdWxlLmV4cG9ydHMgPSBRdWVyeU1hdGhlclxuXG4iLCJcbiMjI1xuIyBmaWxlOiB0ZW1wbGF0ZXMyLmNvZmZlZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jXG4jIENsYXNzIHRvIG1hbmFnZSB0ZW1wbGF0ZXMgYW5kIHJlbmRlciBkYXRhIG9uIGh0bWwgcGFnZS5cbiNcbiMgVGhlIG1haW4gbWV0aG9kIDogcmVuZGVyKGRhdGEpLCBnZXRfaHRtbChkYXRhKVxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMjI1xuXG5cblxuIyBMT0FEIEZJRUxEIE5BTUVTIFxuZmllbGROYW1lcyA9IHt9XG5yYW5rcyA9IFtdXG5cblxucmVuZGVyX2ZpZWxkX3ZhbHVlID0gKG4sbWFzayxkYXRhKSAtPlxuICB2PWRhdGFbbl1cbiAgaWYgbm90IGRhdGFbbl1cbiAgICByZXR1cm4gJydcblxuICBpZiBuID09IFwid2ViX3NpdGVcIlxuICAgIHJldHVybiBcIjxhIHRhcmdldD0nX2JsYW5rJyBocmVmPScje3Z9Jz4je3Z9PC9hPlwiXG4gIGVsc2VcbiAgICBpZiAnJyAhPSBtYXNrXG4gICAgICByZXR1cm4gbnVtZXJhbCh2KS5mb3JtYXQobWFzaylcbiAgICBlbHNlIFxuICAgICAgaWYgdi5sZW5ndGggPiAyMCBhbmRcbiAgICAgIG4gPT0gXCJvcGVuX2Vucm9sbG1lbnRfc2Nob29sc1wiXG4gICAgICB0aGVuIHYgPSB2LnN1YnN0cmluZygwLCAxOSkgKyBcIuKApjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO2NvbG9yOiMwNzRkNzEnICBjbGFzcz0ndG9vbHRpcGdvJyBkYXRhLXRvZ2dsZT0ndG9vbHRpcCcgdGl0bGU9JyN7dn0nPlJlYWQgTW9yZTwvZGl2PlwiXG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiB2XG5cblxuXG5yZW5kZXJfZmllbGRfbmFtZSA9IChmTmFtZSkgLT5cbiAgaWYgZmllbGROYW1lc1tmTmFtZV0/XG4gICAgcmV0dXJuIGZpZWxkTmFtZXNbZk5hbWVdXG5cbiAgcyA9IGZOYW1lLnJlcGxhY2UoL18vZyxcIiBcIilcbiAgcyA9IHMuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzLnN1YnN0cmluZygxKVxuICByZXR1cm4gc1xuXG5cbnJlbmRlcl9maWVsZCA9IChmTmFtZSxkYXRhKS0+XG4gIGlmIFwiX1wiID09IHN1YnN0ciBmTmFtZSwgMCwgMVxuICAgIFwiXCJcIlxuICAgIDxkaXY+XG4gICAgICAgIDxzcGFuIGNsYXNzPSdmLW5hbSc+I3tyZW5kZXJfZmllbGRfbmFtZSBmTmFtZX08L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzPSdmLXZhbCc+Jm5ic3A7PC9zcGFuPlxuICAgIDwvZGl2PlxuICAgIFwiXCJcIlxuICBlbHNlXG4gICAgcmV0dXJuICcnIHVubGVzcyBmVmFsdWUgPSBkYXRhW2ZOYW1lXVxuICAgIFwiXCJcIlxuICAgIDxkaXY+XG4gICAgICAgIDxzcGFuIGNsYXNzPSdmLW5hbSc+I3tyZW5kZXJfZmllbGRfbmFtZSBmTmFtZX08L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzPSdmLXZhbCc+I3tyZW5kZXJfZmllbGRfdmFsdWUoZk5hbWUsZGF0YSl9PC9zcGFuPlxuICAgIDwvZGl2PlxuICAgIFwiXCJcIlxuXG5yZW5kZXJfc3ViaGVhZGluZyA9IChmTmFtZSwgbWFzaywgbm90Rmlyc3QpLT5cbiAgcyA9ICcnXG4gIGZOYW1lID0gcmVuZGVyX2ZpZWxkX25hbWUgZk5hbWVcbiAgaWYgbWFzayA9PSBcImhlYWRpbmdcIlxuICAgIGlmIG5vdEZpcnN0ICE9IDBcbiAgICAgIHMgKz0gXCI8YnIvPlwiXG4gICAgcyArPSBcIjxkaXY+PHNwYW4gY2xhc3M9J2YtbmFtJz4je2ZOYW1lfTwvc3Bhbj48c3BhbiBjbGFzcz0nZi12YWwnPiA8L3NwYW4+PC9kaXY+XCJcbiAgcmV0dXJuIHNcblxucmVuZGVyX2ZpZWxkcyA9IChmaWVsZHMsZGF0YSx0ZW1wbGF0ZSktPlxuICBoID0gJydcbiAgZm9yIGZpZWxkLGkgaW4gZmllbGRzXG4gICAgaWYgKHR5cGVvZiBmaWVsZCBpcyBcIm9iamVjdFwiKVxuICAgICAgaWYgZmllbGQubWFzayA9PSBcImhlYWRpbmdcIlxuICAgICAgICBoICs9IHJlbmRlcl9zdWJoZWFkaW5nKGZpZWxkLm5hbWUsIGZpZWxkLm1hc2ssIGkpXG4gICAgICAgIGZWYWx1ZSA9ICcnXG4gICAgICBlbHNlIFxuICAgICAgICBmVmFsdWUgPSByZW5kZXJfZmllbGRfdmFsdWUgZmllbGQubmFtZSwgZmllbGQubWFzaywgZGF0YVxuICAgICAgICBpZiAoJycgIT0gZlZhbHVlKVxuICAgICAgICAgIGZOYW1lID0gcmVuZGVyX2ZpZWxkX25hbWUgZmllbGQubmFtZVxuICAgIGVsc2VcbiAgICAgIGZWYWx1ZSA9IHJlbmRlcl9maWVsZF92YWx1ZSBmaWVsZCwgJycsIGRhdGFcbiAgICAgIGlmICgnJyAhPSBmVmFsdWUpXG4gICAgICAgIGZOYW1lID0gcmVuZGVyX2ZpZWxkX25hbWUgZmllbGRcbiAgICBpZiAoJycgIT0gZlZhbHVlKVxuICAgICAgaCArPSB0ZW1wbGF0ZShuYW1lOiBmTmFtZSwgdmFsdWU6IGZWYWx1ZSlcbiAgcmV0dXJuIGhcblxucmVuZGVyX2ZpbmFuY2lhbF9maWVsZHMgPSAoZGF0YSx0ZW1wbGF0ZSktPlxuICBoID0gJydcbiAgbWFzayA9ICcwLDAnXG4gIGNhdGVnb3J5ID0gJydcbiAgZm9yIGZpZWxkIGluIGRhdGFcbiAgICBpZiBjYXRlZ29yeSAhPSBmaWVsZC5jYXRlZ29yeV9uYW1lXG4gICAgICBjYXRlZ29yeSA9IGZpZWxkLmNhdGVnb3J5X25hbWVcbiAgICAgIGlmIGNhdGVnb3J5ID09ICdPdmVydmlldycgXG4gICAgICAgIGggKz0gdGVtcGxhdGUobmFtZTogXCI8Yj5cIiArIGNhdGVnb3J5ICsgXCI8L2I+XCIsIGdlbmZ1bmQ6ICcnLCBvdGhlcmZ1bmRzOiAnJywgdG90YWxmdW5kczogJycpXG4gICAgICBlbHNlIGlmIGNhdGVnb3J5ID09ICdSZXZlbnVlcydcbiAgICAgICAgaCArPSAnPC9icj4nIFxuICAgICAgICBoICs9IFwiPGI+XCIgKyB0ZW1wbGF0ZShuYW1lOiBjYXRlZ29yeSwgZ2VuZnVuZDogXCJHZW5lcmFsIEZ1bmRcIiwgb3RoZXJmdW5kczogXCJPdGhlciBGdW5kc1wiLCB0b3RhbGZ1bmRzOiBcIlRvdGFsIEdvdi4gRnVuZHNcIikgKyBcIjwvYj5cIlxuICAgICAgZWxzZSBcbiAgICAgICAgaCArPSAnPC9icj4nXG4gICAgICAgIGggKz0gdGVtcGxhdGUobmFtZTogXCI8Yj5cIiArIGNhdGVnb3J5ICsgXCI8L2I+XCIsIGdlbmZ1bmQ6ICcnLCBvdGhlcmZ1bmRzOiAnJywgdG90YWxmdW5kczogJycpXG4gICAgaWYgZmllbGQuY2FwdGlvbiA9PSAnR2VuZXJhbCBGdW5kIEJhbGFuY2UnIG9yIGZpZWxkLmNhcHRpb24gPT0gJ0xvbmcgVGVybSBEZWJ0J1xuICAgICAgaCArPSB0ZW1wbGF0ZShuYW1lOiBmaWVsZC5jYXB0aW9uLCBnZW5mdW5kOiBudW1lcmFsKGZpZWxkLmdlbmZ1bmQpLmZvcm1hdChtYXNrKSlcbiAgICBlbHNlIFxuICAgICAgaCArPSB0ZW1wbGF0ZShuYW1lOiBmaWVsZC5jYXB0aW9uLCBnZW5mdW5kOiBudW1lcmFsKGZpZWxkLmdlbmZ1bmQpLmZvcm1hdChtYXNrKSwgb3RoZXJmdW5kczogbnVtZXJhbChmaWVsZC5vdGhlcmZ1bmRzKS5mb3JtYXQobWFzayksIHRvdGFsZnVuZHM6IG51bWVyYWwoZmllbGQudG90YWxmdW5kcykuZm9ybWF0KG1hc2spKVxuICByZXR1cm4gaFxuXG51bmRlciA9IChzKSAtPiBzLnJlcGxhY2UoL1tcXHNcXCtcXC1dL2csICdfJylcblxuXG5yZW5kZXJfdGFicyA9IChpbml0aWFsX2xheW91dCwgZGF0YSwgdGFic2V0LCBwYXJlbnQpIC0+XG4gICNsYXlvdXQgPSBhZGRfb3RoZXJfdGFiX3RvX2xheW91dCBpbml0aWFsX2xheW91dCwgZGF0YVxuXG4gIGZvciByIGluIHJhbmtzIFxuICAgIGNvbnNvbGUubG9nIGRhdGFbXCIje3J9XCJdXG5cbiAgbGF5b3V0ID0gaW5pdGlhbF9sYXlvdXRcbiAgdGVtcGxhdGVzID0gcGFyZW50LnRlbXBsYXRlc1xuICBwbG90X2hhbmRsZXMgPSB7fVxuXG4gIGxheW91dF9kYXRhID1cbiAgICB0aXRsZTogZGF0YS5nb3ZfbmFtZVxuICAgIHdpa2lwZWRpYV9wYWdlX2V4aXN0czogZGF0YS53aWtpcGVkaWFfcGFnZV9leGlzdHNcbiAgICB3aWtpcGVkaWFfcGFnZV9uYW1lOiAgZGF0YS53aWtpcGVkaWFfcGFnZV9uYW1lXG4gICAgdHJhbnNwYXJlbnRfY2FsaWZvcm5pYV9wYWdlX25hbWU6IGRhdGEudHJhbnNwYXJlbnRfY2FsaWZvcm5pYV9wYWdlX25hbWVcbiAgICB0YWJzOiBbXVxuICAgIHRhYmNvbnRlbnQ6ICcnXG4gIFxuICBmb3IgdGFiLGkgaW4gbGF5b3V0XG4gICAgbGF5b3V0X2RhdGEudGFicy5wdXNoXG4gICAgICB0YWJpZDogdW5kZXIodGFiLm5hbWUpLFxuICAgICAgdGFibmFtZTogdGFiLm5hbWUsXG4gICAgICBhY3RpdmU6IChpZiBpPjAgdGhlbiAnJyBlbHNlICdhY3RpdmUnKVxuXG4gIGZvciB0YWIsaSBpbiBsYXlvdXRcbiAgICBkZXRhaWxfZGF0YSA9XG4gICAgICB0YWJpZDogdW5kZXIodGFiLm5hbWUpLFxuICAgICAgdGFibmFtZTogdGFiLm5hbWUsXG4gICAgICBhY3RpdmU6IChpZiBpPjAgdGhlbiAnJyBlbHNlICdhY3RpdmUnKVxuICAgICAgdGFiY29udGVudDogJydcbiAgICBzd2l0Y2ggdGFiLm5hbWVcbiAgICAgIHdoZW4gJ092ZXJ2aWV3ICsgRWxlY3RlZCBPZmZpY2lhbHMnXG4gICAgICAgIGRldGFpbF9kYXRhLnRhYmNvbnRlbnQgKz0gcmVuZGVyX2ZpZWxkcyB0YWIuZmllbGRzLCBkYXRhLCB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC1uYW1ldmFsdWUtdGVtcGxhdGUnXVxuICAgICAgICBmb3Igb2ZmaWNpYWwsaSBpbiBkYXRhLmVsZWN0ZWRfb2ZmaWNpYWxzLnJlY29yZFxuICAgICAgICAgIG9mZmljaWFsX2RhdGEgPVxuICAgICAgICAgICAgdGl0bGU6IGlmICcnICE9IG9mZmljaWFsLnRpdGxlIHRoZW4gXCJUaXRsZTogXCIgKyBvZmZpY2lhbC50aXRsZSBlbHNlICcnXG4gICAgICAgICAgICBuYW1lOiBpZiAnJyAhPSBvZmZpY2lhbC5mdWxsX25hbWUgdGhlbiBcIk5hbWU6IFwiICsgb2ZmaWNpYWwuZnVsbF9uYW1lIGVsc2UgJydcbiAgICAgICAgICAgIGVtYWlsOiBpZiBudWxsICE9IG9mZmljaWFsLmVtYWlsX2FkZHJlc3MgdGhlbiBcIkVtYWlsOiBcIiArIG9mZmljaWFsLmVtYWlsX2FkZHJlc3MgZWxzZSAnRW1haWw6ICdcbiAgICAgICAgICAgIHRlbGVwaG9uZW51bWJlcjogaWYgbnVsbCAhPSBvZmZpY2lhbC50ZWxlcGhvbmVfbnVtYmVyIGFuZCB1bmRlZmluZWQgIT0gb2ZmaWNpYWwudGVsZXBob25lX251bWJlciB0aGVuIFwiVGVsZXBob25lIE51bWJlcjpcIiArIG9mZmljaWFsLnRlbGVwaG9uZV9udW1iZXIgZWxzZSBcIlRlbGVwaG9uZSBOdW1iZXI6XCJcbiAgICAgICAgICAgIHRlcm1leHBpcmVzOiBpZiBudWxsICE9IG9mZmljaWFsLnRlcm1fZXhwaXJlcyB0aGVuIFwiVGVybSBFeHBpcmVzOiBcIiArIG9mZmljaWFsLnRlcm1fZXhwaXJlcyBlbHNlICdUZXJtIEV4cGlyZXM6ICdcbiAgICAgICAgICBvZmZpY2lhbF9kYXRhLmltYWdlID0gJzxpbWcgc3JjPVwiJytvZmZpY2lhbC5waG90b191cmwrJ1wiIGNsYXNzPVwicG9ydHJhaXRcIiBhbHQ9XCJcIiAvPicgaWYgJycgIT0gb2ZmaWNpYWwucGhvdG9fdXJsXG4gICAgICAgICAgZGV0YWlsX2RhdGEudGFiY29udGVudCArPSB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC1vZmZpY2lhbC10ZW1wbGF0ZSddKG9mZmljaWFsX2RhdGEpXG4gICAgICB3aGVuICdFbXBsb3llZSBDb21wZW5zYXRpb24nXG4gICAgICAgIGggPSAnJ1xuICAgICAgICBoICs9IHJlbmRlcl9maWVsZHMgdGFiLmZpZWxkcywgZGF0YSwgdGVtcGxhdGVzWyd0YWJkZXRhaWwtbmFtZXZhbHVlLXRlbXBsYXRlJ11cbiAgICAgICAgZGV0YWlsX2RhdGEudGFiY29udGVudCArPSB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC1lbXBsb3llZS1jb21wLXRlbXBsYXRlJ10oY29udGVudDogaClcbiAgICAgICAgaWYgbm90IHBsb3RfaGFuZGxlc1snbWVkaWFuLWNvbXAtZ3JhcGgnXSAgIFxuICAgICAgICAgIGRyYXdDaGFydCA9ICgpIC0+IFxuICAgICAgICAgICAgc2V0VGltZW91dCAoIC0+XG4gICAgICAgICAgICAgIHZpc19kYXRhID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLkRhdGFUYWJsZSgpXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnc3RyaW5nJywgJ01lZGlhbiBDb21wZW5zYXRpb24nXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnbnVtYmVyJywgJ1dhZ2VzJ1xuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRDb2x1bW4gJ251bWJlcicsICdCZW5zLidcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkUm93cyBbXG4gICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgJ0Z1bGwgVGltZSBFbXBsb3llZXMnXG4gICAgICAgICAgICAgICAgICBkYXRhWydtZWRpYW5fc2FsYXJ5X3Blcl9mdWxsX3RpbWVfZW1wJ11cbiAgICAgICAgICAgICAgICAgIGRhdGFbJ21lZGlhbl9iZW5lZml0c19wZXJfZnRfZW1wJ11cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgJ0dlbmVyYWwgUHVibGljJ1xuICAgICAgICAgICAgICAgICAgZGF0YVsnbWVkaWFuX3dhZ2VzX2dlbmVyYWxfcHVibGljJ11cbiAgICAgICAgICAgICAgICAgIGRhdGFbJ21lZGlhbl9iZW5lZml0c19nZW5lcmFsX3B1YmxpYyddXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIGZvcm1hdHRlciA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5OdW1iZXJGb3JtYXQoZ3JvdXBpbmdTeW1ib2w6ICcsJyAsIGZyYWN0aW9uRGlnaXRzOiAnMCcpXG4gICAgICAgICAgICAgIGZvcm1hdHRlci5mb3JtYXQodmlzX2RhdGEsIDEpO1xuICAgICAgICAgICAgICBmb3JtYXR0ZXIuZm9ybWF0KHZpc19kYXRhLCAyKTsgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICBvcHRpb25zID1cbiAgICAgICAgICAgICAgICAndGl0bGUnOidNZWRpYW4gVG90YWwgQ29tcGVuc2F0aW9uIC0gRnVsbCBUaW1lIFdvcmtlcnM6J1xuICAgICAgICAgICAgICAgICd3aWR0aCc6IDM0MFxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAzMDBcbiAgICAgICAgICAgICAgICAnaXNTdGFja2VkJzogJ3RydWUnXG4gICAgICAgICAgICAgICAgJ2NvbG9ycyc6IFsnIzAwNWNlNicsICcjMDA5OTMzJ11cbiAgICAgICAgICAgICAgY2hhcnQgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uQ29sdW1uQ2hhcnQgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgJ21lZGlhbi1jb21wLWdyYXBoJ1xuICAgICAgICAgICAgICBjaGFydC5kcmF3IHZpc19kYXRhLCBvcHRpb25zXG4gICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgKSwgMTAwMFxuICAgICAgICAgIGdvb2dsZS5sb2FkICd2aXN1YWxpemF0aW9uJywgJzEuMCcsXG4gICAgICAgICAgJ2NhbGxiYWNrJyA6IGRyYXdDaGFydCgpXG4gICAgICAgICAgJ3BhY2thZ2VzJyA6J2NvcmVjaGFydCdcbiAgICAgICAgICBwbG90X2hhbmRsZXNbJ21lZGlhbi1jb21wLWdyYXBoJ10gPSdtZWRpYW4tY29tcC1ncmFwaCdcbiAgICAgICAgaWYgbm90IHBsb3RfaGFuZGxlc1snbWVkaWFuLXBlbnNpb24tZ3JhcGgnXSAgIFxuICAgICAgICAgIGRyYXdDaGFydCA9ICgpIC0+IFxuICAgICAgICAgICAgc2V0VGltZW91dCAoIC0+XG4gICAgICAgICAgICAgIHZpc19kYXRhID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLkRhdGFUYWJsZSgpXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnc3RyaW5nJywgJ01lZGlhbiBQZW5zaW9uJ1xuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRDb2x1bW4gJ251bWJlcicsICdCZW5zLidcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkUm93cyBbXG4gICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgJ1BlbnNpb24gZm9yIFxcbiBSZXRpcmVlIHcvIDMwIFllYXJzJ1xuICAgICAgICAgICAgICAgICAgZGF0YVsnbWVkaWFuX3BlbnNpb25fMzBfeWVhcl9yZXRpcmVlJ11cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgZm9ybWF0dGVyID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLk51bWJlckZvcm1hdChncm91cGluZ1N5bWJvbDogJywnICwgZnJhY3Rpb25EaWdpdHM6ICcwJylcbiAgICAgICAgICAgICAgZm9ybWF0dGVyLmZvcm1hdCh2aXNfZGF0YSwgMSk7XG4gICAgICAgICAgICAgIG9wdGlvbnMgPVxuICAgICAgICAgICAgICAgICd0aXRsZSc6J01lZGlhbiBUb3RhbCBQZW5zaW9uJ1xuICAgICAgICAgICAgICAgICd3aWR0aCc6IDM0MFxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAzMDBcbiAgICAgICAgICAgICAgICAnaXNTdGFja2VkJzogJ3RydWUnXG4gICAgICAgICAgICAgICAgJ2NvbG9ycyc6IFsnIzAwNWNlNicsICcjMDA5OTMzJ11cbiAgICAgICAgICAgICAgICAnY2hhcnRBcmVhLndpZHRoJzogJzUwJSdcbiAgICAgICAgICAgICAgY2hhcnQgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uQ29sdW1uQ2hhcnQgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgJ21lZGlhbi1wZW5zaW9uLWdyYXBoJyBcbiAgICAgICAgICAgICAgY2hhcnQuZHJhdyB2aXNfZGF0YSwgb3B0aW9uc1xuICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICksIDEwMDBcbiAgICAgICAgICBnb29nbGUubG9hZCAndmlzdWFsaXphdGlvbicsICcxLjAnLFxuICAgICAgICAgICdjYWxsYmFjaycgOiBkcmF3Q2hhcnQoKVxuICAgICAgICAgICdwYWNrYWdlcycgOidjb3JlY2hhcnQnXG4gICAgICAgICAgcGxvdF9oYW5kbGVzWydtZWRpYW4tcGVuc2lvbi1ncmFwaCddID0nbWVkaWFuLXBlbnNpb24tZ3JhcGgnXG4gICAgICB3aGVuICdGaW5hbmNpYWwgSGVhbHRoJ1xuICAgICAgICBoID0gJydcbiAgICAgICAgaCArPSByZW5kZXJfZmllbGRzIHRhYi5maWVsZHMsIGRhdGEsIHRlbXBsYXRlc1sndGFiZGV0YWlsLW5hbWV2YWx1ZS10ZW1wbGF0ZSddXG4gICAgICAgIGRldGFpbF9kYXRhLnRhYmNvbnRlbnQgKz0gdGVtcGxhdGVzWyd0YWJkZXRhaWwtZmluYW5jaWFsLWhlYWx0aC10ZW1wbGF0ZSddKGNvbnRlbnQ6IGgpXG4gICAgICAgIGlmIG5vdCBwbG90X2hhbmRsZXNbJ3B1YmxpYy1zYWZldHktcGllJ10gICAgICAgICAgICBcbiAgICAgICAgICAgIGRyYXdDaGFydCA9ICgpIC0+IFxuICAgICAgICAgICAgc2V0VGltZW91dCAoIC0+XG4gICAgICAgICAgICAgIHZpc19kYXRhID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLkRhdGFUYWJsZSgpXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnc3RyaW5nJywgJ1B1YmxpYyBzYWZldHkgZXhwZW5zZSdcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdudW1iZXInLCAnVG90YWwnXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZFJvd3MgW1xuICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICdQdWJsaWMgU2FmZXR5IEV4cGVuc2UnXG4gICAgICAgICAgICAgICAgICAxMDAgLSBkYXRhWydwdWJsaWNfc2FmZXR5X2V4cF9vdmVyX3RvdF9nb3ZfZnVuZF9yZXZlbnVlJ11cbiAgICAgICAgICAgICAgICBdICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICdPdGhlciBHb3Zlcm5tZW50YWwgXFxuIEZ1bmQgUmV2ZW51ZSdcbiAgICAgICAgICAgICAgICAgIGRhdGFbJ3B1YmxpY19zYWZldHlfZXhwX292ZXJfdG90X2dvdl9mdW5kX3JldmVudWUnXVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICBvcHRpb25zID1cbiAgICAgICAgICAgICAgICAndGl0bGUnOidQdWJsaWMgc2FmZXR5IGV4cGVuc2UnXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogMzQwXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6IDMwMFxuICAgICAgICAgICAgICAgICdpczNEJyA6ICd0cnVlJ1xuICAgICAgICAgICAgICAgICdjb2xvcnMnOiBbJyMwMDVjZTYnLCAnIzAwOTkzMyddXG4gICAgICAgICAgICAgICAgJ3NsaWNlcyc6IHsgMToge29mZnNldDogMC4yfX1cbiAgICAgICAgICAgICAgICAncGllU3RhcnRBbmdsZSc6IDIwXG4gICAgICAgICAgICAgIGNoYXJ0ID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLlBpZUNoYXJ0IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICdwdWJsaWMtc2FmZXR5LXBpZScgXG4gICAgICAgICAgICAgIGNoYXJ0LmRyYXcgdmlzX2RhdGEsIG9wdGlvbnNcbiAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICApLCAxMDAwXG4gICAgICAgICAgZ29vZ2xlLmxvYWQgJ3Zpc3VhbGl6YXRpb24nLCAnMS4wJyxcbiAgICAgICAgICAnY2FsbGJhY2snIDogZHJhd0NoYXJ0KClcbiAgICAgICAgICAncGFja2FnZXMnIDonY29yZWNoYXJ0J1xuICAgICAgICAgIHBsb3RfaGFuZGxlc1sncHVibGljLXNhZmV0eS1waWUnXSA9J3B1YmxpYy1zYWZldHktcGllJ1xuICAgICAgd2hlbiAnRmluYW5jaWFsIFN0YXRlbWVudHMnXG4gICAgICAgIGlmIGRhdGEuZmluYW5jaWFsX3N0YXRlbWVudHNcbiAgICAgICAgICBoID0gJydcbiAgICAgICAgICAjaCArPSByZW5kZXJfZmllbGRzIHRhYi5maWVsZHMsIGRhdGEsIHRlbXBsYXRlc1sndGFiZGV0YWlsLW5hbWV2YWx1ZS10ZW1wbGF0ZSddXG4gICAgICAgICAgaCArPSByZW5kZXJfZmluYW5jaWFsX2ZpZWxkcyBkYXRhLmZpbmFuY2lhbF9zdGF0ZW1lbnRzLCB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC1maW5zdGF0ZW1lbnQtdGVtcGxhdGUnXVxuICAgICAgICAgIGRldGFpbF9kYXRhLnRhYmNvbnRlbnQgKz0gdGVtcGxhdGVzWyd0YWJkZXRhaWwtZmluYW5jaWFsLXN0YXRlbWVudHMtdGVtcGxhdGUnXShjb250ZW50OiBoKVxuICAgICAgICAgICN0YWJkZXRhaWwtZmluYW5jaWFsLXN0YXRlbWVudHMtdGVtcGxhdGVcbiAgICAgIGVsc2VcbiAgICAgICAgZGV0YWlsX2RhdGEudGFiY29udGVudCArPSByZW5kZXJfZmllbGRzIHRhYi5maWVsZHMsIGRhdGEsIHRlbXBsYXRlc1sndGFiZGV0YWlsLW5hbWV2YWx1ZS10ZW1wbGF0ZSddXG4gICAgXG4gICAgbGF5b3V0X2RhdGEudGFiY29udGVudCArPSB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC10ZW1wbGF0ZSddKGRldGFpbF9kYXRhKVxuICByZXR1cm4gdGVtcGxhdGVzWyd0YWJwYW5lbC10ZW1wbGF0ZSddKGxheW91dF9kYXRhKVxuXG5nZXRfbGF5b3V0X2ZpZWxkcyA9IChsYSkgLT5cbiAgZiA9IHt9XG4gIGZvciB0IGluIGxhXG4gICAgZm9yIGZpZWxkIGluIHQuZmllbGRzXG4gICAgICBmW2ZpZWxkXSA9IDFcbiAgcmV0dXJuIGZcblxuZ2V0X3JlY29yZF9maWVsZHMgPSAocikgLT5cbiAgZiA9IHt9XG4gIGZvciBmaWVsZF9uYW1lIG9mIHJcbiAgICBmW2ZpZWxkX25hbWVdID0gMVxuICByZXR1cm4gZlxuXG5nZXRfdW5tZW50aW9uZWRfZmllbGRzID0gKGxhLCByKSAtPlxuICBsYXlvdXRfZmllbGRzID0gZ2V0X2xheW91dF9maWVsZHMgbGFcbiAgcmVjb3JkX2ZpZWxkcyA9IGdldF9yZWNvcmRfZmllbGRzIHJcbiAgdW5tZW50aW9uZWRfZmllbGRzID0gW11cbiAgdW5tZW50aW9uZWRfZmllbGRzLnB1c2goZikgZm9yIGYgb2YgcmVjb3JkX2ZpZWxkcyB3aGVuIG5vdCBsYXlvdXRfZmllbGRzW2ZdXG4gIHJldHVybiB1bm1lbnRpb25lZF9maWVsZHNcblxuXG5hZGRfb3RoZXJfdGFiX3RvX2xheW91dCA9IChsYXlvdXQ9W10sIGRhdGEpIC0+XG4gICNjbG9uZSB0aGUgbGF5b3V0XG4gIGwgPSAkLmV4dGVuZCB0cnVlLCBbXSwgbGF5b3V0XG4gIHQgPVxuICAgIG5hbWU6IFwiT3RoZXJcIlxuICAgIGZpZWxkczogZ2V0X3VubWVudGlvbmVkX2ZpZWxkcyBsLCBkYXRhXG5cbiAgbC5wdXNoIHRcbiAgcmV0dXJuIGxcblxuIyBjb252ZXJ0cyB0YWIgdGVtcGxhdGUgZGVzY3JpYmVkIGluIGdvb2dsZSBmdXNpb24gdGFibGUgdG8gXG4jIHRhYiB0ZW1wbGF0ZVxuY29udmVydF9mdXNpb25fdGVtcGxhdGU9KHRlbXBsKSAtPlxuICB0YWJfaGFzaD17fVxuICB0YWJzPVtdXG4gICMgcmV0dXJucyBoYXNoIG9mIGZpZWxkIG5hbWVzIGFuZCB0aGVpciBwb3NpdGlvbnMgaW4gYXJyYXkgb2YgZmllbGQgbmFtZXNcbiAgZ2V0X2NvbF9oYXNoID0gKGNvbHVtbnMpIC0+XG4gICAgY29sX2hhc2ggPXt9XG4gICAgY29sX2hhc2hbY29sX25hbWVdPWkgZm9yIGNvbF9uYW1lLGkgaW4gdGVtcGwuY29sdW1uc1xuICAgIHJldHVybiBjb2xfaGFzaFxuXG4gICMgcmV0dXJucyBmaWVsZCB2YWx1ZSBieSBpdHMgbmFtZSwgYXJyYXkgb2YgZmllbGRzLCBhbmQgaGFzaCBvZiBmaWVsZHNcbiAgdmFsID0gKGZpZWxkX25hbWUsIGZpZWxkcywgY29sX2hhc2gpIC0+XG4gICAgZmllbGRzW2NvbF9oYXNoW2ZpZWxkX25hbWVdXSAgXG5cbiAgIyBjb252ZXJ0cyBoYXNoIHRvIGFuIGFycmF5IHRlbXBsYXRlXG4gIGhhc2hfdG9fYXJyYXkgPShoYXNoKSAtPlxuICAgIGEgPSBbXVxuICAgIGZvciBrIG9mIGhhc2hcbiAgICAgIHRhYiA9IHt9XG4gICAgICB0YWIubmFtZT1rXG4gICAgICB0YWIuZmllbGRzPWhhc2hba11cbiAgICAgICNjb25zb2xlLmxvZyBoYXNoW2tdXG4gICAgICBhLnB1c2ggdGFiXG4gICAgcmV0dXJuIGFcblxuICAgIFxuICBjb2xfaGFzaCA9IGdldF9jb2xfaGFzaCh0ZW1wbC5jb2xfaGFzaClcbiAgcGxhY2Vob2xkZXJfY291bnQgPSAwXG4gIFxuICBmb3Igcm93LGkgaW4gdGVtcGwucm93c1xuICAgIGNhdGVnb3J5ID0gdmFsICdnZW5lcmFsX2NhdGVnb3J5Jywgcm93LCBjb2xfaGFzaFxuICAgICN0YWJfaGFzaFtjYXRlZ29yeV09W10gdW5sZXNzIHRhYl9oYXNoW2NhdGVnb3J5XVxuICAgIGZpZWxkbmFtZSA9IHZhbCAnZmllbGRfbmFtZScsIHJvdywgY29sX2hhc2hcbiAgICBpZiBub3QgZmllbGRuYW1lIHRoZW4gZmllbGRuYW1lID0gXCJfXCIgKyBTdHJpbmcgKytwbGFjZWhvbGRlcl9jb3VudFxuICAgIGZpZWxkTmFtZXNbdmFsICdmaWVsZF9uYW1lJywgcm93LCBjb2xfaGFzaF09dmFsICdkZXNjcmlwdGlvbicsIHJvdywgY29sX2hhc2hcbiAgICByYW5rID0gdmFsICdyYW5rJywgcm93LCBjb2xfaGFzaFxuICAgIGlmIHJhbmsgPT0gJ3gnXG4gICAgICByYW5rcy5wdXNoIFwiI3tmaWVsZG5hbWV9X3JhbmtcIlxuICAgICAgI2NvbnNvbGUubG9nIFwiI3tmaWVsZG5hbWV9X3JhbmtcIlxuICAgIGlmIGNhdGVnb3J5XG4gICAgICB0YWJfaGFzaFtjYXRlZ29yeV0/PVtdXG4gICAgICB0YWJfaGFzaFtjYXRlZ29yeV0ucHVzaCBuOiB2YWwoJ24nLCByb3csIGNvbF9oYXNoKSwgbmFtZTogZmllbGRuYW1lLCBtYXNrOiB2YWwoJ21hc2snLCByb3csIGNvbF9oYXNoKSwgcmFuazogdmFsICdyYW5rJywgcm93LCBjb2xfaGFzaFxuXG4gIGNhdGVnb3JpZXMgPSBPYmplY3Qua2V5cyh0YWJfaGFzaClcbiAgY2F0ZWdvcmllc19zb3J0ID0ge31cbiAgZm9yIGNhdGVnb3J5IGluIGNhdGVnb3JpZXNcbiAgICBpZiBub3QgY2F0ZWdvcmllc19zb3J0W2NhdGVnb3J5XVxuICAgICAgY2F0ZWdvcmllc19zb3J0W2NhdGVnb3J5XSA9IHRhYl9oYXNoW2NhdGVnb3J5XVswXS5uXG4gICAgZmllbGRzID0gW11cbiAgICBmb3Igb2JqIGluIHRhYl9oYXNoW2NhdGVnb3J5XVxuICAgICAgZmllbGRzLnB1c2ggb2JqXG4gICAgZmllbGRzLnNvcnQgKGEsYikgLT5cbiAgICAgIHJldHVybiBhLm4gLSBiLm5cbiAgICB0YWJfaGFzaFtjYXRlZ29yeV0gPSBmaWVsZHNcblxuICBjYXRlZ29yaWVzX2FycmF5ID0gW11cbiAgZm9yIGNhdGVnb3J5LCBuIG9mIGNhdGVnb3JpZXNfc29ydFxuICAgIGNhdGVnb3JpZXNfYXJyYXkucHVzaCBjYXRlZ29yeTogY2F0ZWdvcnksIG46IG5cbiAgY2F0ZWdvcmllc19hcnJheS5zb3J0IChhLGIpIC0+XG4gICAgcmV0dXJuIGEubiAtIGIublxuXG4gIHRhYl9uZXdoYXNoID0ge31cbiAgZm9yIGNhdGVnb3J5IGluIGNhdGVnb3JpZXNfYXJyYXlcbiAgICB0YWJfbmV3aGFzaFtjYXRlZ29yeS5jYXRlZ29yeV0gPSB0YWJfaGFzaFtjYXRlZ29yeS5jYXRlZ29yeV1cbiAgICAjY29uc29sZS5sb2cgdGFiX25ld2hhc2hbY2F0ZWdvcnkuY2F0ZWdvcnldXG5cbiAgdGFicyA9IGhhc2hfdG9fYXJyYXkodGFiX25ld2hhc2gpXG4gIHJldHVybiB0YWJzXG5cbmNsYXNzIFRlbXBsYXRlczJcblxuICBAbGlzdCA9IHVuZGVmaW5lZFxuICBAdGVtcGxhdGVzID0gdW5kZWZpbmVkXG4gIEBkYXRhID0gdW5kZWZpbmVkXG4gIEBldmVudHMgPSB1bmRlZmluZWRcblxuICBjb25zdHJ1Y3RvcjooKSAtPlxuICAgIEBsaXN0ID0gW11cbiAgICBAZXZlbnRzID0ge31cbiAgICB0ZW1wbGF0ZUxpc3QgPSBbJ3RhYnBhbmVsLXRlbXBsYXRlJywgJ3RhYmRldGFpbC10ZW1wbGF0ZScsICd0YWJkZXRhaWwtbmFtZXZhbHVlLXRlbXBsYXRlJywgJ3RhYmRldGFpbC1maW5zdGF0ZW1lbnQtdGVtcGxhdGUnLCAndGFiZGV0YWlsLW9mZmljaWFsLXRlbXBsYXRlJywgJ3RhYmRldGFpbC1lbXBsb3llZS1jb21wLXRlbXBsYXRlJywgJ3RhYmRldGFpbC1maW5hbmNpYWwtaGVhbHRoLXRlbXBsYXRlJywgJ3RhYmRldGFpbC1maW5hbmNpYWwtc3RhdGVtZW50cy10ZW1wbGF0ZSddXG4gICAgdGVtcGxhdGVQYXJ0aWFscyA9IFsndGFiLXRlbXBsYXRlJ11cbiAgICBAdGVtcGxhdGVzID0ge31cbiAgICBmb3IgdGVtcGxhdGUsaSBpbiB0ZW1wbGF0ZUxpc3RcbiAgICAgIEB0ZW1wbGF0ZXNbdGVtcGxhdGVdID0gSGFuZGxlYmFycy5jb21waWxlKCQoJyMnICsgdGVtcGxhdGUpLmh0bWwoKSlcbiAgICBmb3IgdGVtcGxhdGUsaSBpbiB0ZW1wbGF0ZVBhcnRpYWxzXG4gICAgICBIYW5kbGViYXJzLnJlZ2lzdGVyUGFydGlhbCh0ZW1wbGF0ZSwgJCgnIycgKyB0ZW1wbGF0ZSkuaHRtbCgpKVxuXG4gIGFkZF90ZW1wbGF0ZTogKGxheW91dF9uYW1lLCBsYXlvdXRfanNvbikgLT5cbiAgICBAbGlzdC5wdXNoXG4gICAgICBwYXJlbnQ6dGhpc1xuICAgICAgbmFtZTpsYXlvdXRfbmFtZVxuICAgICAgcmVuZGVyOihkYXQpIC0+XG4gICAgICAgIEBwYXJlbnQuZGF0YSA9IGRhdFxuICAgICAgICByZW5kZXJfdGFicyhsYXlvdXRfanNvbiwgZGF0LCB0aGlzLCBAcGFyZW50KVxuICAgICAgYmluZDogKHRwbF9uYW1lLCBjYWxsYmFjaykgLT5cbiAgICAgICAgaWYgbm90IEBwYXJlbnQuZXZlbnRzW3RwbF9uYW1lXVxuICAgICAgICAgIEBwYXJlbnQuZXZlbnRzW3RwbF9uYW1lXSA9IFtjYWxsYmFja11cbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBwYXJlbnQuZXZlbnRzW3RwbF9uYW1lXS5wdXNoIGNhbGxiYWNrXG4gICAgICBhY3RpdmF0ZTogKHRwbF9uYW1lKSAtPlxuICAgICAgICBpZiBAcGFyZW50LmV2ZW50c1t0cGxfbmFtZV1cbiAgICAgICAgICBmb3IgZSxpIGluIEBwYXJlbnQuZXZlbnRzW3RwbF9uYW1lXVxuICAgICAgICAgICAgZSB0cGxfbmFtZSwgQHBhcmVudC5kYXRhXG5cbiAgbG9hZF90ZW1wbGF0ZToodGVtcGxhdGVfbmFtZSwgdXJsKSAtPlxuICAgICQuYWpheFxuICAgICAgdXJsOiB1cmxcbiAgICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICAgIGNhY2hlOiB0cnVlXG4gICAgICBzdWNjZXNzOiAodGVtcGxhdGVfanNvbikgPT5cbiAgICAgICAgQGFkZF90ZW1wbGF0ZSh0ZW1wbGF0ZV9uYW1lLCB0ZW1wbGF0ZV9qc29uKVxuICAgICAgICByZXR1cm5cblxuICBsb2FkX2Z1c2lvbl90ZW1wbGF0ZToodGVtcGxhdGVfbmFtZSwgdXJsKSAtPlxuICAgICQuYWpheFxuICAgICAgdXJsOiB1cmxcbiAgICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICAgIGNhY2hlOiB0cnVlXG4gICAgICBzdWNjZXNzOiAodGVtcGxhdGVfanNvbikgPT5cbiAgICAgICAgdCA9IGNvbnZlcnRfZnVzaW9uX3RlbXBsYXRlIHRlbXBsYXRlX2pzb25cbiAgICAgICAgQGFkZF90ZW1wbGF0ZSh0ZW1wbGF0ZV9uYW1lLCB0KVxuICAgICAgICByZXR1cm5cblxuXG4gIGdldF9uYW1lczogLT5cbiAgICAodC5uYW1lIGZvciB0IGluIEBsaXN0KVxuXG4gIGdldF9pbmRleF9ieV9uYW1lOiAobmFtZSkgLT5cbiAgICBmb3IgdCxpIGluIEBsaXN0XG4gICAgICBpZiB0Lm5hbWUgaXMgbmFtZVxuICAgICAgICByZXR1cm4gaVxuICAgICByZXR1cm4gLTFcblxuICBnZXRfaHRtbDogKGluZCwgZGF0YSkgLT5cbiAgICBpZiAoaW5kIGlzIC0xKSB0aGVuIHJldHVybiAgXCJcIlxuICAgIFxuICAgIGlmIEBsaXN0W2luZF1cbiAgICAgIHJldHVybiBAbGlzdFtpbmRdLnJlbmRlcihkYXRhKVxuICAgIGVsc2VcbiAgICAgIHJldHVybiBcIlwiXG5cbiAgYWN0aXZhdGU6IChpbmQsIHRwbF9uYW1lKSAtPlxuICAgIGlmIEBsaXN0W2luZF1cbiAgICAgIEBsaXN0W2luZF0uYWN0aXZhdGUgdHBsX25hbWVcblxubW9kdWxlLmV4cG9ydHMgPSBUZW1wbGF0ZXMyXG4iXX0=
