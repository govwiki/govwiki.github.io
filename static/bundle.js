(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var add_marker, bounds_timeout, clear, create_info_window, geocode, geocode_addr, get_icon, get_records, get_records2, map, on_bounds_changed, on_bounds_changed_later, pinImage, rebuild_filter,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

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

map.map.controls[google.maps.ControlPosition.RIGHT_TOP].push(document.getElementById('legend'));

$(function() {
  return $('#legend li').on('click', function() {
    var hidden_field, value;
    $(this).toggleClass('active');
    hidden_field = $(this).find('input');
    value = hidden_field.val();
    hidden_field.val(value === '1' ? '0' : '1');
    return rebuild_filter();
  });
});

rebuild_filter = function() {
  var hard_params;
  hard_params = ['City', 'School District', 'Special District'];
  GOVWIKI.gov_type_filter_2 = [];
  $('.type_filter').each(function(index, element) {
    var ref;
    if ((ref = $(element).attr('name'), indexOf.call(hard_params, ref) >= 0) && $(element).val() === '1') {
      return GOVWIKI.gov_type_filter_2.push($(element).attr('name'));
    }
  });
  return on_bounds_changed_later(350);
};

on_bounds_changed_later = function(msec) {
  clearTimeout(bounds_timeout);
  return bounds_timeout = setTimeout(on_bounds_changed, msec);
};

on_bounds_changed = function(e) {
  var additional_filter, b, first, gov_type, gtf, i, len, ne, ne_lat, ne_lng, q2, st, sw, sw_lat, sw_lng, ty, url_value;
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
  gtf = GOVWIKI.gov_type_filter_2;

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
  q2 = " latitude<" + ne_lat + " AND latitude>" + sw_lat + " AND longitude<" + ne_lng + " AND longitude>" + sw_lng + " AND alt_type!=\"County\" ";
  if (st) {
    q2 += " AND state=\"" + st + "\" ";
  }
  if (ty) {
    q2 += " AND gov_type=\"" + ty + "\" ";
  }
  if (gtf.length > 0) {
    first = true;
    additional_filter = " AND (";
    for (i = 0, len = gtf.length; i < len; i++) {
      gov_type = gtf[i];
      if (!first) {
        additional_filter += " OR";
      }
      additional_filter += " alt_type=\"" + gov_type + "\" ";
      first = false;
    }
    additional_filter += ")";
    q2 += additional_filter;
  } else {
    q2 += " AND alt_type!=\"City\" AND alt_type!=\"School District\" AND alt_type!=\"Special District\" ";
  }
  return get_records2(q2, 200, function(data) {
    var j, len1, rec, ref;
    map.removeMarkers();
    ref = data.record;
    for (j = 0, len1 = ref.length; j < len1; j++) {
      rec = ref[j];
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
  on_bounds_changed_later: on_bounds_changed_later,
  map: map
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
var GovSelector, Templates2, activate_tab, active_tab, adjust_typeahead_width, build_select_element, build_selector, draw_polygons, focus_search_field, get_counties, get_elected_officials, get_financial_statements, get_record, get_record2, gov_selector, govmap, livereload, router, start_adjusting_typeahead_width, templates;

GovSelector = require('./govselector.coffee');

Templates2 = require('./templates2.coffee');

govmap = require('./govmap.coffee');

window.GOVWIKI = {
  state_filter: '',
  gov_type_filter: '',
  gov_type_filter_2: ['City', 'School District', 'Special District'],
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

get_counties = function(callback) {
  return $.ajax({
    url: 'data/county_geography_ca.json',
    dataType: 'json',
    cache: true,
    success: function(countiesJSON) {
      return callback(countiesJSON);
    }
  });
};

draw_polygons = function(countiesJSON) {
  var county, i, len, ref, results;
  ref = countiesJSON.features;
  results = [];
  for (i = 0, len = ref.length; i < len; i++) {
    county = ref[i];
    results.push(govmap.map.drawPolygon({
      paths: county.geometry.coordinates,
      useGeoJSON: true,
      strokeColor: '#FF0000',
      strokeOpacity: 0.6,
      strokeWeight: 1.5,
      fillColor: '#FF0000',
      fillOpacity: 0.15,
      countyId: county.properties._id,
      marker: new MarkerWithLabel({
        position: new google.maps.LatLng(0, 0),
        draggable: false,
        raiseOnDrag: false,
        map: govmap.map.map,
        labelContent: county.properties.name,
        labelAnchor: new google.maps.Point(-15, 25),
        labelClass: "label-tooltip",
        labelStyle: {
          opacity: 1.0
        },
        icon: "http://placehold.it/1x1",
        visible: false
      }),
      mouseover: function() {
        return this.setOptions({
          fillColor: "#00FF00"
        });
      },
      mousemove: function(event) {
        this.marker.setPosition(event.latLng);
        return this.marker.setVisible(true);
      },
      mouseout: function() {
        this.setOptions({
          fillColor: "#FF0000"
        });
        return this.marker.setVisible(false);
      },
      click: function() {
        return router.navigate(this.countyId);
      }
    }));
  }
  return results;
};

get_counties(draw_polygons);

window.remember_tab = function(name) {
  return active_tab = name;
};

$(document).on('click', '#fieldTabs a', function(e) {
  var finValWidthMax1, finValWidthMax2, finValWidthMax3;
  active_tab = $(e.currentTarget).data('tabname');
  console.log(active_tab);
  $("#tabsContent .tab-pane").removeClass("active");
  $($(e.currentTarget).attr('href')).addClass("active");
  templates.activate(0, active_tab);
  if (active_tab === 'Financial Statements') {
    finValWidthMax1 = 0;
    finValWidthMax2 = 0;
    finValWidthMax3 = 0;
    $('[data-col="1"]').find('.fin-val').each(function() {
      var thisFinValWidth;
      thisFinValWidth = $(this).width();
      if (thisFinValWidth > finValWidthMax1) {
        return finValWidthMax1 = thisFinValWidth;
      }
    });
    $('[data-col="2"]').find('.fin-val').each(function() {
      var thisFinValWidth;
      thisFinValWidth = $(this).width();
      if (thisFinValWidth > finValWidthMax2) {
        return finValWidthMax2 = thisFinValWidth;
      }
    });
    $('[data-col="3"]').find('.fin-val').each(function() {
      var thisFinValWidth;
      thisFinValWidth = $(this).width();
      if (thisFinValWidth > finValWidthMax3) {
        return finValWidthMax3 = thisFinValWidth;
      }
    });
    $('[data-col="1"] .currency-sign').css('right', finValWidthMax1 + 27);
    $('[data-col="2"] .currency-sign').css('right', finValWidthMax2 + 27);
    return $('[data-col="3"] .currency-sign').css('right', finValWidthMax3 + 27);
  }
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
      return $('body').append("<div style='position:absolute;z-index:1000;\nwidth:100%; top:0;color:red; text-align: center;\npadding:1px;font-size:10px;line-height:1'>live</div>");
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
        if (v.length > 21) {
          v = v.substring(0, 21);
        } else {

        }
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
    return "<div>\n    <span class='f-nam' >" + (render_field_name(fName)) + "</span>\n    <span class='f-val'>&nbsp;</span>\n</div>";
  } else {
    if (!(fValue = data[fName])) {
      return '';
    }
    return "<div>\n    <span class='f-nam'  >" + (render_field_name(fName)) + "<div></span>\n    <span class='f-val'>" + (render_field_value(fName, data)) + "</span>\n</div>";
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
    fields_with_dollar_sign = ['Taxes', 'Capital Outlay', 'Total Revenues', 'Total Expenditures', 'Surplus / (Deficit)'];
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
    return "(" + sign + ('<span class="fin-val">' + s + '</span>') + ")";
  }
  n = n.format(mask);
  return "" + sign + ('<span class="fin-val">' + n + '</span>');
};

render_tabs = function(initial_layout, data, tabset, parent) {
  var detail_data, drawChart, graph, h, i, j, layout, layout_data, len, len1, len2, m, o, official, official_data, plot_handles, ref, tab, templates;
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
          graph = true;
          if (data['median_salary_per_full_time_emp'] === 0) {
            graph = false;
          }
          if (data['median_benefits_per_ft_emp'] === 0) {
            graph = false;
          }
          if (data['median_wages_general_public'] === 0) {
            graph = false;
          }
          if (data['median_benefits_general_public'] === 0) {
            graph = false;
          }
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
          if (graph) {
            google.load('visualization', '1.0', {
              'callback': drawChart(),
              'packages': 'corechart'
            });
          }
          plot_handles['median-comp-graph'] = 'median-comp-graph';
        }
        if (!plot_handles['median-pension-graph']) {
          graph = true;
          if (data['median_pension_30_year_retiree'] === 0) {
            graph = false;
          }
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
              if (graph) {
                chart = new google.visualization.ColumnChart(document.getElementById('median-pension-graph'));
                chart.draw(vis_data, options);
              }
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
          graph = true;
          if (data['public_safety_exp_over_tot_gov_fund_revenue'] === 0) {
            graph = false;
          }
          drawChart = function() {
            return setTimeout((function() {
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
          };
          if (graph) {
            google.load('visualization', '1.0', {
              'callback': drawChart(),
              'packages': 'corechart'
            });
          }
          plot_handles['public-safety-pie'] = 'public-safety-pie';
        }
        if (!plot_handles['fin-health-revenue-graph']) {
          graph = true;
          if (data['total_revenue_per_capita'] === 0) {
            graph = false;
          }
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
          if (graph) {
            google.load('visualization', '1.0', {
              'callback': drawChart(),
              'packages': 'corechart'
            });
          }
          plot_handles['fin-health-revenue-graph'] = 'fin-health-revenue-graph';
        }
        if (!plot_handles['fin-health-expenditures-graph']) {
          graph = true;
          if (data['total_expenditures_per_capita'] === 0) {
            graph = false;
          }
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
              if (graph) {
                chart = new google.visualization.ColumnChart(document.getElementById('fin-health-expenditures-graph'));
                chart.draw(vis_data, options);
              }
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
            graph = true;
            if (data.financial_statements.length === 0) {
              graph = false;
            }
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
              if (graph) {
                chart = new google.visualization.PieChart(document.getElementById('total-expenditures-pie'));
                chart.draw(vis_data, options);
              }
            }), 1000);
          }
          if (graph) {
            google.load('visualization', '1.0', {
              'callback': drawChart(),
              'packages': 'corechart'
            });
          }
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiRDpcXFByb2plY3RzXFxnb3Z3aWtpLWRldi51c1xcY29mZmVlXFxnb3ZtYXAuY29mZmVlIiwiRDpcXFByb2plY3RzXFxnb3Z3aWtpLWRldi51c1xcY29mZmVlXFxnb3ZzZWxlY3Rvci5jb2ZmZWUiLCJEOlxcUHJvamVjdHNcXGdvdndpa2ktZGV2LnVzXFxjb2ZmZWVcXG1haW4uY29mZmVlIiwiRDpcXFByb2plY3RzXFxnb3Z3aWtpLWRldi51c1xcY29mZmVlXFxxdWVyeW1hdGNoZXIuY29mZmVlIiwiRDpcXFByb2plY3RzXFxnb3Z3aWtpLWRldi51c1xcY29mZmVlXFx0ZW1wbGF0ZXMyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLElBQUEsNExBQUE7RUFBQTs7QUFBQSxjQUFBLEdBQWU7O0FBR2YsR0FBQSxHQUFVLElBQUEsS0FBQSxDQUNSO0VBQUEsRUFBQSxFQUFJLFNBQUo7RUFDQSxHQUFBLEVBQUssRUFETDtFQUVBLEdBQUEsRUFBSyxDQUFDLEdBRk47RUFHQSxJQUFBLEVBQU0sQ0FITjtFQUlBLFdBQUEsRUFBYSxLQUpiO0VBS0EsVUFBQSxFQUFZLEtBTFo7RUFNQSxXQUFBLEVBQWEsSUFOYjtFQU9BLGtCQUFBLEVBQ0U7SUFBQSxLQUFBLEVBQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFwQztHQVJGO0VBU0EsY0FBQSxFQUFnQixTQUFBO1dBQ2QsdUJBQUEsQ0FBd0IsR0FBeEI7RUFEYyxDQVRoQjtDQURROztBQWFWLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUyxDQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFNBQTVCLENBQXNDLENBQUMsSUFBeEQsQ0FBNkQsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsUUFBeEIsQ0FBN0Q7O0FB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RUFBTSxRQUFOO0lBQ1IsSUFBRyxJQUFDLENBQUEsSUFBSyxDQUFBLEdBQUEsQ0FBVDthQUNFLElBQUMsQ0FBQSxJQUFLLENBQUEsR0FBQSxDQUFJLENBQUMsUUFBWCxDQUFvQixRQUFwQixFQURGOztFQURROzs7Ozs7QUFJWixNQUFNLENBQUMsT0FBUCxHQUFpQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJib3VuZHNfdGltZW91dD11bmRlZmluZWRcclxuXHJcblxyXG5tYXAgPSBuZXcgR01hcHNcclxuICBlbDogJyNnb3ZtYXAnXHJcbiAgbGF0OiAzN1xyXG4gIGxuZzogLTExOVxyXG4gIHpvb206IDZcclxuICBzY3JvbGx3aGVlbDogZmFsc2VcclxuICBwYW5Db250cm9sOiBmYWxzZVxyXG4gIHpvb21Db250cm9sOiB0cnVlXHJcbiAgem9vbUNvbnRyb2xPcHRpb25zOlxyXG4gICAgc3R5bGU6IGdvb2dsZS5tYXBzLlpvb21Db250cm9sU3R5bGUuU01BTExcclxuICBib3VuZHNfY2hhbmdlZDogLT5cclxuICAgIG9uX2JvdW5kc19jaGFuZ2VkX2xhdGVyIDIwMFxyXG5cclxubWFwLm1hcC5jb250cm9sc1tnb29nbGUubWFwcy5Db250cm9sUG9zaXRpb24uUklHSFRfVE9QXS5wdXNoKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsZWdlbmQnKSlcclxuXHJcbiQgLT5cclxuICAkKCcjbGVnZW5kIGxpJykub24gJ2NsaWNrJywgLT5cclxuICAgICQodGhpcykudG9nZ2xlQ2xhc3MoJ2FjdGl2ZScpXHJcbiAgICBoaWRkZW5fZmllbGQgPSAkKHRoaXMpLmZpbmQoJ2lucHV0JylcclxuICAgIHZhbHVlID0gaGlkZGVuX2ZpZWxkLnZhbCgpXHJcbiAgICBoaWRkZW5fZmllbGQudmFsKGlmIHZhbHVlID09ICcxJyB0aGVuICcwJyBlbHNlICcxJylcclxuICAgIHJlYnVpbGRfZmlsdGVyKClcclxuXHJcbnJlYnVpbGRfZmlsdGVyID0gLT5cclxuICBoYXJkX3BhcmFtcyA9IFsnQ2l0eScsICdTY2hvb2wgRGlzdHJpY3QnLCAnU3BlY2lhbCBEaXN0cmljdCddXHJcbiAgR09WV0lLSS5nb3ZfdHlwZV9maWx0ZXJfMiA9IFtdXHJcbiAgJCgnLnR5cGVfZmlsdGVyJykuZWFjaCAoaW5kZXgsIGVsZW1lbnQpIC0+XHJcbiAgICBpZiAkKGVsZW1lbnQpLmF0dHIoJ25hbWUnKSBpbiBoYXJkX3BhcmFtcyBhbmQgJChlbGVtZW50KS52YWwoKSA9PSAnMSdcclxuICAgICAgR09WV0lLSS5nb3ZfdHlwZV9maWx0ZXJfMi5wdXNoICQoZWxlbWVudCkuYXR0cignbmFtZScpXHJcbiAgb25fYm91bmRzX2NoYW5nZWRfbGF0ZXIgMzUwXHJcblxyXG5vbl9ib3VuZHNfY2hhbmdlZF9sYXRlciAgPSAobXNlYykgIC0+XHJcbiAgY2xlYXJUaW1lb3V0IGJvdW5kc190aW1lb3V0XHJcbiAgYm91bmRzX3RpbWVvdXQgPSBzZXRUaW1lb3V0IG9uX2JvdW5kc19jaGFuZ2VkLCBtc2VjXHJcblxyXG4gICAgXHJcbm9uX2JvdW5kc19jaGFuZ2VkID0oZSkgLT5cclxuICBjb25zb2xlLmxvZyBcImJvdW5kc19jaGFuZ2VkXCJcclxuICBiPW1hcC5nZXRCb3VuZHMoKVxyXG4gIHVybF92YWx1ZT1iLnRvVXJsVmFsdWUoKVxyXG4gIG5lPWIuZ2V0Tm9ydGhFYXN0KClcclxuICBzdz1iLmdldFNvdXRoV2VzdCgpXHJcbiAgbmVfbGF0PW5lLmxhdCgpXHJcbiAgbmVfbG5nPW5lLmxuZygpXHJcbiAgc3dfbGF0PXN3LmxhdCgpXHJcbiAgc3dfbG5nPXN3LmxuZygpXHJcbiAgc3QgPSBHT1ZXSUtJLnN0YXRlX2ZpbHRlclxyXG4gIHR5ID0gR09WV0lLSS5nb3ZfdHlwZV9maWx0ZXJcclxuICBndGYgPSBHT1ZXSUtJLmdvdl90eXBlX2ZpbHRlcl8yXHJcblxyXG4gICMjI1xyXG4gICMgQnVpbGQgdGhlIHF1ZXJ5LlxyXG4gIHE9XCJcIlwiIFwibGF0aXR1ZGVcIjp7XCIkbHRcIjoje25lX2xhdH0sXCIkZ3RcIjoje3N3X2xhdH19LFwibG9uZ2l0dWRlXCI6e1wiJGx0XCI6I3tuZV9sbmd9LFwiJGd0XCI6I3tzd19sbmd9fVwiXCJcIlxyXG4gICMgQWRkIGZpbHRlcnMgaWYgdGhleSBleGlzdFxyXG4gIHErPVwiXCJcIixcInN0YXRlXCI6XCIje3N0fVwiIFwiXCJcIiBpZiBzdFxyXG4gIHErPVwiXCJcIixcImdvdl90eXBlXCI6XCIje3R5fVwiIFwiXCJcIiBpZiB0eVxyXG5cclxuXHJcbiAgZ2V0X3JlY29yZHMgcSwgMjAwLCAgKGRhdGEpIC0+XHJcbiAgICAjY29uc29sZS5sb2cgXCJsZW5ndGg9I3tkYXRhLmxlbmd0aH1cIlxyXG4gICAgI2NvbnNvbGUubG9nIFwibGF0OiAje25lX2xhdH0sI3tzd19sYXR9IGxuZzogI3tuZV9sbmd9LCAje3N3X2xuZ31cIlxyXG4gICAgbWFwLnJlbW92ZU1hcmtlcnMoKVxyXG4gICAgYWRkX21hcmtlcihyZWMpIGZvciByZWMgaW4gZGF0YVxyXG4gICAgcmV0dXJuXHJcbiAgIyMjXHJcblxyXG4gICMgQnVpbGQgdGhlIHF1ZXJ5IDIuXHJcbiAgcTI9XCJcIlwiIGxhdGl0dWRlPCN7bmVfbGF0fSBBTkQgbGF0aXR1ZGU+I3tzd19sYXR9IEFORCBsb25naXR1ZGU8I3tuZV9sbmd9IEFORCBsb25naXR1ZGU+I3tzd19sbmd9IEFORCBhbHRfdHlwZSE9XCJDb3VudHlcIiBcIlwiXCJcclxuICAjIEFkZCBmaWx0ZXJzIGlmIHRoZXkgZXhpc3RcclxuICBxMis9XCJcIlwiIEFORCBzdGF0ZT1cIiN7c3R9XCIgXCJcIlwiIGlmIHN0XHJcbiAgcTIrPVwiXCJcIiBBTkQgZ292X3R5cGU9XCIje3R5fVwiIFwiXCJcIiBpZiB0eVxyXG5cclxuICBpZiBndGYubGVuZ3RoID4gMFxyXG4gICAgZmlyc3QgPSB0cnVlXHJcbiAgICBhZGRpdGlvbmFsX2ZpbHRlciA9IFwiXCJcIiBBTkQgKFwiXCJcIlxyXG4gICAgZm9yIGdvdl90eXBlIGluIGd0ZlxyXG4gICAgICBpZiBub3QgZmlyc3RcclxuICAgICAgICBhZGRpdGlvbmFsX2ZpbHRlciArPSBcIlwiXCIgT1JcIlwiXCJcclxuICAgICAgYWRkaXRpb25hbF9maWx0ZXIgKz0gXCJcIlwiIGFsdF90eXBlPVwiI3tnb3ZfdHlwZX1cIiBcIlwiXCJcclxuICAgICAgZmlyc3QgPSBmYWxzZVxyXG4gICAgYWRkaXRpb25hbF9maWx0ZXIgKz0gXCJcIlwiKVwiXCJcIlxyXG5cclxuICAgIHEyICs9IGFkZGl0aW9uYWxfZmlsdGVyXHJcbiAgZWxzZVxyXG4gICAgcTIgKz0gXCJcIlwiIEFORCBhbHRfdHlwZSE9XCJDaXR5XCIgQU5EIGFsdF90eXBlIT1cIlNjaG9vbCBEaXN0cmljdFwiIEFORCBhbHRfdHlwZSE9XCJTcGVjaWFsIERpc3RyaWN0XCIgXCJcIlwiXHJcblxyXG4gIGdldF9yZWNvcmRzMiBxMiwgMjAwLCAgKGRhdGEpIC0+XHJcbiAgICAjY29uc29sZS5sb2cgXCJsZW5ndGg9I3tkYXRhLmxlbmd0aH1cIlxyXG4gICAgI2NvbnNvbGUubG9nIFwibGF0OiAje25lX2xhdH0sI3tzd19sYXR9IGxuZzogI3tuZV9sbmd9LCAje3N3X2xuZ31cIlxyXG4gICAgbWFwLnJlbW92ZU1hcmtlcnMoKVxyXG4gICAgYWRkX21hcmtlcihyZWMpIGZvciByZWMgaW4gZGF0YS5yZWNvcmRcclxuICAgIHJldHVyblxyXG5cclxuZ2V0X2ljb24gPShnb3ZfdHlwZSkgLT5cclxuICBcclxuICBfY2lyY2xlID0oY29sb3IpLT5cclxuICAgIHBhdGg6IGdvb2dsZS5tYXBzLlN5bWJvbFBhdGguQ0lSQ0xFXHJcbiAgICBmaWxsT3BhY2l0eTogMC41XHJcbiAgICBmaWxsQ29sb3I6Y29sb3JcclxuICAgIHN0cm9rZVdlaWdodDogMVxyXG4gICAgc3Ryb2tlQ29sb3I6J3doaXRlJ1xyXG4gICAgI3N0cm9rZVBvc2l0aW9uOiBnb29nbGUubWFwcy5TdHJva2VQb3NpdGlvbi5PVVRTSURFXHJcbiAgICBzY2FsZTo2XHJcblxyXG4gIHN3aXRjaCBnb3ZfdHlwZVxyXG4gICAgd2hlbiAnR2VuZXJhbCBQdXJwb3NlJyB0aGVuIHJldHVybiBfY2lyY2xlICcjMDNDJ1xyXG4gICAgd2hlbiAnQ2VtZXRlcmllcycgICAgICB0aGVuIHJldHVybiBfY2lyY2xlICcjMDAwJ1xyXG4gICAgd2hlbiAnSG9zcGl0YWxzJyAgICAgICB0aGVuIHJldHVybiBfY2lyY2xlICcjMEMwJ1xyXG4gICAgZWxzZSByZXR1cm4gX2NpcmNsZSAnI0QyMCdcclxuXHJcblxyXG5cclxuXHJcbmFkZF9tYXJrZXIgPShyZWMpLT5cclxuICAjY29uc29sZS5sb2cgXCIje3JlYy5yYW5kfSAje3JlYy5pbmNfaWR9ICN7cmVjLnppcH0gI3tyZWMubGF0aXR1ZGV9ICN7cmVjLmxvbmdpdHVkZX0gI3tyZWMuZ292X25hbWV9XCJcclxuICBtYXAuYWRkTWFya2VyXHJcbiAgICBsYXQ6IHJlYy5sYXRpdHVkZVxyXG4gICAgbG5nOiByZWMubG9uZ2l0dWRlXHJcbiAgICBpY29uOiBnZXRfaWNvbihyZWMuZ292X3R5cGUpXHJcbiAgICB0aXRsZTogIFwiI3tyZWMuZ292X25hbWV9LCAje3JlYy5nb3ZfdHlwZX0gKCN7cmVjLmxhdGl0dWRlfSwgI3tyZWMubG9uZ2l0dWRlfSlcIlxyXG4gICAgaW5mb1dpbmRvdzpcclxuICAgICAgY29udGVudDogY3JlYXRlX2luZm9fd2luZG93IHJlY1xyXG4gICAgY2xpY2s6IChlKS0+XHJcbiAgICAgICN3aW5kb3cuR09WV0lLSS5zaG93X3JlY29yZCByZWNcclxuICAgICAgd2luZG93LkdPVldJS0kuc2hvd19yZWNvcmQyIHJlY1xyXG4gIFxyXG4gIHJldHVyblxyXG5cclxuXHJcbmNyZWF0ZV9pbmZvX3dpbmRvdyA9KHIpIC0+XHJcbiAgdyA9ICQoJzxkaXY+PC9kaXY+JylcclxuICAuYXBwZW5kICQoXCI8YSBocmVmPScjJz48c3Ryb25nPiN7ci5nb3ZfbmFtZX08L3N0cm9uZz48L2E+XCIpLmNsaWNrIChlKS0+XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgIGNvbnNvbGUubG9nIHJcclxuICAgICN3aW5kb3cuR09WV0lLSS5zaG93X3JlY29yZCByXHJcbiAgICB3aW5kb3cuR09WV0lLSS5zaG93X3JlY29yZDIgclxyXG5cclxuICAuYXBwZW5kICQoXCI8ZGl2PiAje3IuZ292X3R5cGV9ICAje3IuY2l0eX0gI3tyLnppcH0gI3tyLnN0YXRlfTwvZGl2PlwiKVxyXG4gIHJldHVybiB3WzBdXHJcblxyXG5cclxuXHJcblxyXG5nZXRfcmVjb3JkcyA9IChxdWVyeSwgbGltaXQsIG9uc3VjY2VzcykgLT5cclxuICAkLmFqYXhcclxuICAgIHVybDogXCJodHRwczovL2FwaS5tb25nb2xhYi5jb20vYXBpLzEvZGF0YWJhc2VzL2dvdndpa2kvY29sbGVjdGlvbnMvZ292cy8/cT17I3txdWVyeX19JmY9e19pZDowfSZsPSN7bGltaXR9JnM9e3JhbmQ6MX0mYXBpS2V5PTBZNVhfUWsydU9KUmRISldKS1NSV2s2bDZKcVZUUzJ5XCJcclxuICAgIGRhdGFUeXBlOiAnanNvbidcclxuICAgIGNhY2hlOiB0cnVlXHJcbiAgICBzdWNjZXNzOiBvbnN1Y2Nlc3NcclxuICAgIGVycm9yOihlKSAtPlxyXG4gICAgICBjb25zb2xlLmxvZyBlXHJcblxyXG5cclxuZ2V0X3JlY29yZHMyID0gKHF1ZXJ5LCBsaW1pdCwgb25zdWNjZXNzKSAtPlxyXG4gICQuYWpheFxyXG4gICAgdXJsOlwiaHR0cDovLzQ2LjEwMS4zLjc5OjgwL3Jlc3QvZGIvZ292c1wiXHJcbiAgICBkYXRhOlxyXG4gICAgICAjZmlsdGVyOlwibGF0aXR1ZGU+MzIgQU5EIGxhdGl0dWRlPDM0IEFORCBsb25naXR1ZGU+LTg3IEFORCBsb25naXR1ZGU8LTg2XCJcclxuICAgICAgZmlsdGVyOnF1ZXJ5XHJcbiAgICAgIGZpZWxkczpcIl9pZCxpbmNfaWQsZ292X25hbWUsZ292X3R5cGUsY2l0eSx6aXAsc3RhdGUsbGF0aXR1ZGUsbG9uZ2l0dWRlXCJcclxuICAgICAgYXBwX25hbWU6XCJnb3Z3aWtpXCJcclxuICAgICAgb3JkZXI6XCJyYW5kXCJcclxuICAgICAgbGltaXQ6bGltaXRcclxuXHJcbiAgICBkYXRhVHlwZTogJ2pzb24nXHJcbiAgICBjYWNoZTogdHJ1ZVxyXG4gICAgc3VjY2Vzczogb25zdWNjZXNzXHJcbiAgICBlcnJvcjooZSkgLT5cclxuICAgICAgY29uc29sZS5sb2cgZVxyXG5cclxuIyBHRU9DT0RJTkcgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5cclxucGluSW1hZ2UgPSBuZXcgKGdvb2dsZS5tYXBzLk1hcmtlckltYWdlKShcclxuICAnaHR0cDovL2NoYXJ0LmFwaXMuZ29vZ2xlLmNvbS9jaGFydD9jaHN0PWRfbWFwX3Bpbl9sZXR0ZXImY2hsZD1afDc3NzdCQnxGRkZGRkYnICxcclxuICBuZXcgKGdvb2dsZS5tYXBzLlNpemUpKDIxLCAzNCksXHJcbiAgbmV3IChnb29nbGUubWFwcy5Qb2ludCkoMCwgMCksXHJcbiAgbmV3IChnb29nbGUubWFwcy5Qb2ludCkoMTAsIDM0KVxyXG4gIClcclxuXHJcblxyXG5nZW9jb2RlX2FkZHIgPSAoYWRkcixkYXRhKSAtPlxyXG4gIEdNYXBzLmdlb2NvZGVcclxuICAgIGFkZHJlc3M6IGFkZHJcclxuICAgIGNhbGxiYWNrOiAocmVzdWx0cywgc3RhdHVzKSAtPlxyXG4gICAgICBpZiBzdGF0dXMgPT0gJ09LJ1xyXG4gICAgICAgIGxhdGxuZyA9IHJlc3VsdHNbMF0uZ2VvbWV0cnkubG9jYXRpb25cclxuICAgICAgICBtYXAuc2V0Q2VudGVyIGxhdGxuZy5sYXQoKSwgbGF0bG5nLmxuZygpXHJcbiAgICAgICAgbWFwLmFkZE1hcmtlclxyXG4gICAgICAgICAgbGF0OiBsYXRsbmcubGF0KClcclxuICAgICAgICAgIGxuZzogbGF0bG5nLmxuZygpXHJcbiAgICAgICAgICBzaXplOiAnc21hbGwnXHJcbiAgICAgICAgICB0aXRsZTogcmVzdWx0c1swXS5mb3JtYXR0ZWRfYWRkcmVzc1xyXG4gICAgICAgICAgaW5mb1dpbmRvdzpcclxuICAgICAgICAgICAgY29udGVudDogcmVzdWx0c1swXS5mb3JtYXR0ZWRfYWRkcmVzc1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIGRhdGFcclxuICAgICAgICAgIG1hcC5hZGRNYXJrZXJcclxuICAgICAgICAgICAgbGF0OiBkYXRhLmxhdGl0dWRlXHJcbiAgICAgICAgICAgIGxuZzogZGF0YS5sb25naXR1ZGVcclxuICAgICAgICAgICAgc2l6ZTogJ3NtYWxsJ1xyXG4gICAgICAgICAgICBjb2xvcjogJ2JsdWUnXHJcbiAgICAgICAgICAgIGljb246IHBpbkltYWdlXHJcbiAgICAgICAgICAgIHRpdGxlOiAgXCIje2RhdGEubGF0aXR1ZGV9ICN7ZGF0YS5sb25naXR1ZGV9XCJcclxuICAgICAgICAgICAgaW5mb1dpbmRvdzpcclxuICAgICAgICAgICAgICBjb250ZW50OiBcIiN7ZGF0YS5sYXRpdHVkZX0gI3tkYXRhLmxvbmdpdHVkZX1cIlxyXG4gICAgICAgICAgICBcclxuICAgICAgICAkKCcuZ292bWFwLWZvdW5kJykuaHRtbCBcIjxzdHJvbmc+Rk9VTkQ6IDwvc3Ryb25nPiN7cmVzdWx0c1swXS5mb3JtYXR0ZWRfYWRkcmVzc31cIlxyXG4gICAgICByZXR1cm5cclxuXHJcblxyXG5jbGVhcj0ocyktPlxyXG4gIHJldHVybiBpZiBzLm1hdGNoKC8gYm94IC9pKSB0aGVuICcnIGVsc2Ugc1xyXG5cclxuZ2VvY29kZSA9IChkYXRhKSAtPlxyXG4gIGFkZHIgPSBcIiN7Y2xlYXIoZGF0YS5hZGRyZXNzMSl9ICN7Y2xlYXIoZGF0YS5hZGRyZXNzMil9LCAje2RhdGEuY2l0eX0sICN7ZGF0YS5zdGF0ZX0gI3tkYXRhLnppcH0sIFVTQVwiXHJcbiAgJCgnI2dvdmFkZHJlc3MnKS52YWwoYWRkcilcclxuICBnZW9jb2RlX2FkZHIgYWRkciwgZGF0YVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID1cclxuICBnZW9jb2RlOiBnZW9jb2RlXHJcbiAgZ29jb2RlX2FkZHI6IGdlb2NvZGVfYWRkclxyXG4gIG9uX2JvdW5kc19jaGFuZ2VkOiBvbl9ib3VuZHNfY2hhbmdlZFxyXG4gIG9uX2JvdW5kc19jaGFuZ2VkX2xhdGVyOiBvbl9ib3VuZHNfY2hhbmdlZF9sYXRlclxyXG4gIG1hcDogbWFwXHJcbiIsIlxyXG5xdWVyeV9tYXRjaGVyID0gcmVxdWlyZSgnLi9xdWVyeW1hdGNoZXIuY29mZmVlJylcclxuXHJcbmNsYXNzIEdvdlNlbGVjdG9yXHJcbiAgXHJcbiAgIyBzdHViIG9mIGEgY2FsbGJhY2sgdG8gZW52b2tlIHdoZW4gdGhlIHVzZXIgc2VsZWN0cyBzb21ldGhpbmdcclxuICBvbl9zZWxlY3RlZDogKGV2dCwgZGF0YSwgbmFtZSkgLT5cclxuXHJcblxyXG4gIGNvbnN0cnVjdG9yOiAoQGh0bWxfc2VsZWN0b3IsIGRvY3NfdXJsLCBAbnVtX2l0ZW1zKSAtPlxyXG4gICAgJC5hamF4XHJcbiAgICAgIHVybDogZG9jc191cmxcclxuICAgICAgZGF0YVR5cGU6ICdqc29uJ1xyXG4gICAgICBjYWNoZTogdHJ1ZVxyXG4gICAgICBzdWNjZXNzOiBAc3RhcnRTdWdnZXN0aW9uXHJcbiAgICAgIFxyXG5cclxuXHJcblxyXG4gIHN1Z2dlc3Rpb25UZW1wbGF0ZSA6IEhhbmRsZWJhcnMuY29tcGlsZShcIlwiXCJcclxuICAgIDxkaXYgY2xhc3M9XCJzdWdnLWJveFwiPlxyXG4gICAgICA8ZGl2IGNsYXNzPVwic3VnZy1zdGF0ZVwiPnt7e3N0YXRlfX19PC9kaXY+XHJcbiAgICAgIDxkaXYgY2xhc3M9XCJzdWdnLW5hbWVcIj57e3tnb3ZfbmFtZX19fTwvZGl2PlxyXG4gICAgICA8ZGl2IGNsYXNzPVwic3VnZy10eXBlXCI+e3t7Z292X3R5cGV9fX08L2Rpdj5cclxuICAgIDwvZGl2PlwiXCJcIilcclxuXHJcblxyXG5cclxuICBlbnRlcmVkX3ZhbHVlID0gXCJcIlxyXG5cclxuICBnb3ZzX2FycmF5ID0gW11cclxuXHJcbiAgY291bnRfZ292cyA6ICgpIC0+XHJcbiAgICBjb3VudCA9MFxyXG4gICAgZm9yIGQgaW4gQGdvdnNfYXJyYXlcclxuICAgICAgaWYgR09WV0lLSS5zdGF0ZV9maWx0ZXIgYW5kIGQuc3RhdGUgaXNudCBHT1ZXSUtJLnN0YXRlX2ZpbHRlciB0aGVuIGNvbnRpbnVlXHJcbiAgICAgIGlmIEdPVldJS0kuZ292X3R5cGVfZmlsdGVyIGFuZCBkLmdvdl90eXBlIGlzbnQgR09WV0lLSS5nb3ZfdHlwZV9maWx0ZXIgdGhlbiBjb250aW51ZVxyXG4gICAgICBjb3VudCsrXHJcbiAgICByZXR1cm4gY291bnRcclxuXHJcblxyXG4gIHN0YXJ0U3VnZ2VzdGlvbiA6IChnb3ZzKSA9PlxyXG4gICAgI0Bnb3ZzX2FycmF5ID0gZ292c1xyXG4gICAgQGdvdnNfYXJyYXkgPSBnb3ZzLnJlY29yZFxyXG4gICAgJCgnLnR5cGVhaGVhZCcpLmtleXVwIChldmVudCkgPT5cclxuICAgICAgQGVudGVyZWRfdmFsdWUgPSAkKGV2ZW50LnRhcmdldCkudmFsKClcclxuICAgIFxyXG4gICAgJChAaHRtbF9zZWxlY3RvcikuYXR0ciAncGxhY2Vob2xkZXInLCAnR09WRVJOTUVOVCBOQU1FJ1xyXG4gICAgJChAaHRtbF9zZWxlY3RvcikudHlwZWFoZWFkKFxyXG4gICAgICAgIGhpbnQ6IGZhbHNlXHJcbiAgICAgICAgaGlnaGxpZ2h0OiBmYWxzZVxyXG4gICAgICAgIG1pbkxlbmd0aDogMVxyXG4gICAgICAgIGNsYXNzTmFtZXM6XHJcbiAgICAgICAgXHRtZW51OiAndHQtZHJvcGRvd24tbWVudSdcclxuICAgICAgLFxyXG4gICAgICAgIG5hbWU6ICdnb3ZfbmFtZSdcclxuICAgICAgICBkaXNwbGF5S2V5OiAnZ292X25hbWUnXHJcbiAgICAgICAgc291cmNlOiBxdWVyeV9tYXRjaGVyKEBnb3ZzX2FycmF5LCBAbnVtX2l0ZW1zKVxyXG4gICAgICAgICNzb3VyY2U6IGJsb29kaG91bmQudHRBZGFwdGVyKClcclxuICAgICAgICB0ZW1wbGF0ZXM6IHN1Z2dlc3Rpb246IEBzdWdnZXN0aW9uVGVtcGxhdGVcclxuICAgIClcclxuICAgIC5vbiAndHlwZWFoZWFkOnNlbGVjdGVkJywgIChldnQsIGRhdGEsIG5hbWUpID0+XHJcbiAgICAgICAgJCgnLnR5cGVhaGVhZCcpLnR5cGVhaGVhZCAndmFsJywgQGVudGVyZWRfdmFsdWVcclxuICAgICAgICBAb25fc2VsZWN0ZWQoZXZ0LCBkYXRhLCBuYW1lKVxyXG4gICBcclxuICAgIC5vbiAndHlwZWFoZWFkOmN1cnNvcmNoYW5nZWQnLCAoZXZ0LCBkYXRhLCBuYW1lKSA9PlxyXG4gICAgICAgICQoJy50eXBlYWhlYWQnKS52YWwgQGVudGVyZWRfdmFsdWVcclxuICAgIFxyXG5cclxuICAgICQoJy5nb3YtY291bnRlcicpLnRleHQgQGNvdW50X2dvdnMoKVxyXG4gICAgcmV0dXJuXHJcblxyXG5cclxuXHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHM9R292U2VsZWN0b3JcclxuXHJcblxyXG5cclxuIiwiIyMjXHJcbmZpbGU6IG1haW4uY29mZmUgLS0gVGhlIGVudHJ5IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgOlxyXG5nb3ZfZmluZGVyID0gbmV3IEdvdkZpbmRlclxyXG5nb3ZfZGV0YWlscyA9IG5ldyBHb3ZEZXRhaWxzXHJcbmdvdl9maW5kZXIub25fc2VsZWN0ID0gZ292X2RldGFpbHMuc2hvd1xyXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4jIyNcclxuXHJcbkdvdlNlbGVjdG9yID0gcmVxdWlyZSAnLi9nb3ZzZWxlY3Rvci5jb2ZmZWUnXHJcbiNfanFncyAgICAgICA9IHJlcXVpcmUgJy4vanF1ZXJ5LmdvdnNlbGVjdG9yLmNvZmZlZSdcclxuVGVtcGxhdGVzMiAgICAgID0gcmVxdWlyZSAnLi90ZW1wbGF0ZXMyLmNvZmZlZSdcclxuZ292bWFwICAgICAgPSByZXF1aXJlICcuL2dvdm1hcC5jb2ZmZWUnXHJcbiNzY3JvbGx0byA9IHJlcXVpcmUgJy4uL2Jvd2VyX2NvbXBvbmVudHMvanF1ZXJ5LnNjcm9sbFRvL2pxdWVyeS5zY3JvbGxUby5qcydcclxuXHJcbndpbmRvdy5HT1ZXSUtJID1cclxuICBzdGF0ZV9maWx0ZXIgOiAnJ1xyXG4gIGdvdl90eXBlX2ZpbHRlciA6ICcnXHJcbiAgZ292X3R5cGVfZmlsdGVyXzIgOiBbJ0NpdHknLCAnU2Nob29sIERpc3RyaWN0JywgJ1NwZWNpYWwgRGlzdHJpY3QnXVxyXG5cclxuICBzaG93X3NlYXJjaF9wYWdlOiAoKSAtPlxyXG4gICAgJCh3aW5kb3cpLnNjcm9sbFRvKCcwcHgnLDEwKVxyXG4gICAgJCgnI2RhdGFDb250YWluZXInKS5oaWRlKClcclxuICAgICQoJyNzZWFyY2hJY29uJykuaGlkZSgpXHJcbiAgICAkKCcjc2VhcmNoQ29udGFpbmVyJykuZmFkZUluKDMwMClcclxuICAgIGZvY3VzX3NlYXJjaF9maWVsZCA1MDBcclxuXHJcbiAgc2hvd19kYXRhX3BhZ2U6ICgpIC0+XHJcbiAgICAkKHdpbmRvdykuc2Nyb2xsVG8oJzBweCcsMTApXHJcbiAgICAkKCcjc2VhcmNoSWNvbicpLnNob3coKVxyXG4gICAgJCgnI2RhdGFDb250YWluZXInKS5mYWRlSW4oMzAwKVxyXG4gICAgJCgnI3NlYXJjaENvbnRhaW5lcicpLmhpZGUoKVxyXG4gICAgIyQod2luZG93KS5zY3JvbGxUbygnI3BCYWNrVG9TZWFyY2gnLDYwMClcclxuXHJcblxyXG5cclxuXHJcbiNnb3Zfc2VsZWN0b3IgPSBuZXcgR292U2VsZWN0b3IgJy50eXBlYWhlYWQnLCAnZGF0YS9oX3R5cGVzLmpzb24nLCA3XHJcbmdvdl9zZWxlY3RvciA9IG5ldyBHb3ZTZWxlY3RvciAnLnR5cGVhaGVhZCcsICdkYXRhL2hfdHlwZXNfY2EuanNvbicsIDdcclxuI2dvdl9zZWxlY3RvciA9IG5ldyBHb3ZTZWxlY3RvciAnLnR5cGVhaGVhZCcsICdodHRwOi8vNDYuMTAxLjMuNzkvcmVzdC9kYi9nb3ZzP2ZpbHRlcj1zdGF0ZT0lMjJDQSUyMiZhcHBfbmFtZT1nb3Z3aWtpJmZpZWxkcz1faWQsZ292X25hbWUsZ292X3R5cGUsc3RhdGUmbGltaXQ9NTAwMCcsIDdcclxudGVtcGxhdGVzID0gbmV3IFRlbXBsYXRlczJcclxuYWN0aXZlX3RhYj1cIlwiXHJcblxyXG4jXCJcclxuXHJcbiMgZmlyZSBjbGllbnQtc2lkZSBVUkwgcm91dGluZ1xyXG5yb3V0ZXIgPSBuZXcgR3JhcG5lbFxyXG5yb3V0ZXIuZ2V0ICc6aWQnLCAocmVxKSAtPlxyXG4gIGlkID0gcmVxLnBhcmFtcy5pZFxyXG4gIGNvbnNvbGUubG9nIFwiUk9VVEVSIElEPSN7aWR9XCJcclxuICBnZXRfZWxlY3RlZF9vZmZpY2lhbHMgPSAoZ292X2lkLCBsaW1pdCwgb25zdWNjZXNzKSAtPlxyXG4gICAgJC5hamF4XHJcbiAgICAgIHVybDpcImh0dHA6Ly80Ni4xMDEuMy43OTo4MC9yZXN0L2RiL2VsZWN0ZWRfb2ZmaWNpYWxzXCJcclxuICAgICAgZGF0YTpcclxuICAgICAgICBmaWx0ZXI6XCJnb3ZzX2lkPVwiICsgZ292X2lkXHJcbiAgICAgICAgZmllbGRzOlwiZ292c19pZCx0aXRsZSxmdWxsX25hbWUsZW1haWxfYWRkcmVzcyxwaG90b191cmwsdGVybV9leHBpcmVzXCJcclxuICAgICAgICBhcHBfbmFtZTpcImdvdndpa2lcIlxyXG4gICAgICAgIG9yZGVyOlwiZGlzcGxheV9vcmRlclwiXHJcbiAgICAgICAgbGltaXQ6bGltaXRcclxuXHJcbiAgICAgIGRhdGFUeXBlOiAnanNvbidcclxuICAgICAgY2FjaGU6IHRydWVcclxuICAgICAgc3VjY2Vzczogb25zdWNjZXNzXHJcbiAgICAgIGVycm9yOihlKSAtPlxyXG4gICAgICAgIGNvbnNvbGUubG9nIGVcclxuXHJcbiAgZWxlY3RlZF9vZmZpY2lhbHMgPSBnZXRfZWxlY3RlZF9vZmZpY2lhbHMgaWQsIDI1LCAoZWxlY3RlZF9vZmZpY2lhbHNfZGF0YSwgdGV4dFN0YXR1cywganFYSFIpIC0+XHJcbiAgICBkYXRhID0gbmV3IE9iamVjdCgpXHJcbiAgICBkYXRhLl9pZCA9IGlkXHJcbiAgICBkYXRhLmVsZWN0ZWRfb2ZmaWNpYWxzID0gZWxlY3RlZF9vZmZpY2lhbHNfZGF0YVxyXG4gICAgZGF0YS5nb3ZfbmFtZSA9IFwiXCJcclxuICAgIGRhdGEuZ292X3R5cGUgPSBcIlwiXHJcbiAgICBkYXRhLnN0YXRlID0gXCJcIlxyXG4gICAgJCgnI2RldGFpbHMnKS5odG1sIHRlbXBsYXRlcy5nZXRfaHRtbCgwLCBkYXRhKVxyXG4gICAgZ2V0X3JlY29yZDIgZGF0YS5faWRcclxuICAgIGFjdGl2YXRlX3RhYigpXHJcbiAgICBHT1ZXSUtJLnNob3dfZGF0YV9wYWdlKClcclxuICAgIHJldHVyblxyXG5cclxuXHJcbmdldF9jb3VudGllcyA9IChjYWxsYmFjaykgLT5cclxuICAkLmFqYXhcclxuICAgIHVybDogJ2RhdGEvY291bnR5X2dlb2dyYXBoeV9jYS5qc29uJ1xyXG4gICAgZGF0YVR5cGU6ICdqc29uJ1xyXG4gICAgY2FjaGU6IHRydWVcclxuICAgIHN1Y2Nlc3M6IChjb3VudGllc0pTT04pIC0+XHJcbiAgICAgIGNhbGxiYWNrIGNvdW50aWVzSlNPTlxyXG5cclxuZHJhd19wb2x5Z29ucyA9IChjb3VudGllc0pTT04pIC0+XHJcbiAgZm9yIGNvdW50eSBpbiBjb3VudGllc0pTT04uZmVhdHVyZXNcclxuICAgIGdvdm1hcC5tYXAuZHJhd1BvbHlnb24oe1xyXG4gICAgICBwYXRoczogY291bnR5Lmdlb21ldHJ5LmNvb3JkaW5hdGVzXHJcbiAgICAgIHVzZUdlb0pTT046IHRydWVcclxuICAgICAgc3Ryb2tlQ29sb3I6ICcjRkYwMDAwJ1xyXG4gICAgICBzdHJva2VPcGFjaXR5OiAwLjZcclxuICAgICAgc3Ryb2tlV2VpZ2h0OiAxLjVcclxuICAgICAgZmlsbENvbG9yOiAnI0ZGMDAwMCdcclxuICAgICAgZmlsbE9wYWNpdHk6IDAuMTVcclxuICAgICAgY291bnR5SWQ6IGNvdW50eS5wcm9wZXJ0aWVzLl9pZFxyXG4gICAgICBtYXJrZXI6IG5ldyBNYXJrZXJXaXRoTGFiZWwoe1xyXG4gICAgICAgIHBvc2l0aW9uOiBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKDAsMCksXHJcbiAgICAgICAgZHJhZ2dhYmxlOiBmYWxzZSxcclxuICAgICAgICByYWlzZU9uRHJhZzogZmFsc2UsXHJcbiAgICAgICAgbWFwOiBnb3ZtYXAubWFwLm1hcCxcclxuICAgICAgICBsYWJlbENvbnRlbnQ6IGNvdW50eS5wcm9wZXJ0aWVzLm5hbWUsXHJcbiAgICAgICAgbGFiZWxBbmNob3I6IG5ldyBnb29nbGUubWFwcy5Qb2ludCgtMTUsIDI1KSxcclxuICAgICAgICBsYWJlbENsYXNzOiBcImxhYmVsLXRvb2x0aXBcIixcclxuICAgICAgICBsYWJlbFN0eWxlOiB7b3BhY2l0eTogMS4wfSxcclxuICAgICAgICBpY29uOiBcImh0dHA6Ly9wbGFjZWhvbGQuaXQvMXgxXCIsXHJcbiAgICAgICAgdmlzaWJsZTogZmFsc2VcclxuICAgICAgfSlcclxuICAgICAgbW91c2VvdmVyOiAtPlxyXG4gICAgICAgIHRoaXMuc2V0T3B0aW9ucyh7ZmlsbENvbG9yOiBcIiMwMEZGMDBcIn0pXHJcbiAgICAgIG1vdXNlbW92ZTogKGV2ZW50KSAtPlxyXG4gICAgICAgIHRoaXMubWFya2VyLnNldFBvc2l0aW9uKGV2ZW50LmxhdExuZylcclxuICAgICAgICB0aGlzLm1hcmtlci5zZXRWaXNpYmxlKHRydWUpXHJcbiAgICAgIG1vdXNlb3V0OiAtPlxyXG4gICAgICAgIHRoaXMuc2V0T3B0aW9ucyh7ZmlsbENvbG9yOiBcIiNGRjAwMDBcIn0pXHJcbiAgICAgICAgdGhpcy5tYXJrZXIuc2V0VmlzaWJsZShmYWxzZSlcclxuICAgICAgY2xpY2s6IC0+XHJcbiAgICAgICAgcm91dGVyLm5hdmlnYXRlIHRoaXMuY291bnR5SWRcclxuICAgIH0pXHJcblxyXG5nZXRfY291bnRpZXMgZHJhd19wb2x5Z29uc1xyXG5cclxud2luZG93LnJlbWVtYmVyX3RhYiA9KG5hbWUpLT4gYWN0aXZlX3RhYiA9IG5hbWVcclxuXHJcbiN3aW5kb3cuZ2VvY29kZV9hZGRyID0gKGlucHV0X3NlbGVjdG9yKS0+IGdvdm1hcC5nb2NvZGVfYWRkciAkKGlucHV0X3NlbGVjdG9yKS52YWwoKVxyXG5cclxuJChkb2N1bWVudCkub24gJ2NsaWNrJywgJyNmaWVsZFRhYnMgYScsIChlKSAtPlxyXG4gIGFjdGl2ZV90YWIgPSAkKGUuY3VycmVudFRhcmdldCkuZGF0YSgndGFibmFtZScpXHJcbiAgY29uc29sZS5sb2cgYWN0aXZlX3RhYlxyXG4gICQoXCIjdGFic0NvbnRlbnQgLnRhYi1wYW5lXCIpLnJlbW92ZUNsYXNzKFwiYWN0aXZlXCIpXHJcbiAgJCgkKGUuY3VycmVudFRhcmdldCkuYXR0cignaHJlZicpKS5hZGRDbGFzcyhcImFjdGl2ZVwiKVxyXG4gIHRlbXBsYXRlcy5hY3RpdmF0ZSAwLCBhY3RpdmVfdGFiXHJcblxyXG4gIGlmIGFjdGl2ZV90YWIgPT0gJ0ZpbmFuY2lhbCBTdGF0ZW1lbnRzJ1xyXG4gICAgZmluVmFsV2lkdGhNYXgxID0gMFxyXG4gICAgZmluVmFsV2lkdGhNYXgyID0gMFxyXG4gICAgZmluVmFsV2lkdGhNYXgzID0gMFxyXG5cclxuICAgICQoJ1tkYXRhLWNvbD1cIjFcIl0nKS5maW5kKCcuZmluLXZhbCcpLmVhY2ggKCkgLT5cclxuICAgICAgICB0aGlzRmluVmFsV2lkdGggPSAkKHRoaXMpLndpZHRoKClcclxuXHJcbiAgICAgICAgaWYgdGhpc0ZpblZhbFdpZHRoID4gZmluVmFsV2lkdGhNYXgxXHJcbiAgICAgICAgICAgIGZpblZhbFdpZHRoTWF4MSA9IHRoaXNGaW5WYWxXaWR0aFxyXG5cclxuICAgICQoJ1tkYXRhLWNvbD1cIjJcIl0nKS5maW5kKCcuZmluLXZhbCcpLmVhY2ggKCkgLT5cclxuICAgICAgICB0aGlzRmluVmFsV2lkdGggPSAkKHRoaXMpLndpZHRoKClcclxuXHJcbiAgICAgICAgaWYgdGhpc0ZpblZhbFdpZHRoID4gZmluVmFsV2lkdGhNYXgyXHJcbiAgICAgICAgICAgIGZpblZhbFdpZHRoTWF4MiA9IHRoaXNGaW5WYWxXaWR0aFxyXG5cclxuICAgICQoJ1tkYXRhLWNvbD1cIjNcIl0nKS5maW5kKCcuZmluLXZhbCcpLmVhY2ggKCkgLT5cclxuICAgICAgICB0aGlzRmluVmFsV2lkdGggPSAkKHRoaXMpLndpZHRoKClcclxuXHJcbiAgICAgICAgaWYgdGhpc0ZpblZhbFdpZHRoID4gZmluVmFsV2lkdGhNYXgzXHJcbiAgICAgICAgICAgIGZpblZhbFdpZHRoTWF4MyA9IHRoaXNGaW5WYWxXaWR0aFxyXG5cclxuICAgICQoJ1tkYXRhLWNvbD1cIjFcIl0gLmN1cnJlbmN5LXNpZ24nKS5jc3MoJ3JpZ2h0JywgZmluVmFsV2lkdGhNYXgxICsgMjcpXHJcbiAgICAkKCdbZGF0YS1jb2w9XCIyXCJdIC5jdXJyZW5jeS1zaWduJykuY3NzKCdyaWdodCcsIGZpblZhbFdpZHRoTWF4MiArIDI3KVxyXG4gICAgJCgnW2RhdGEtY29sPVwiM1wiXSAuY3VycmVuY3ktc2lnbicpLmNzcygncmlnaHQnLCBmaW5WYWxXaWR0aE1heDMgKyAyNylcclxuXHJcblxyXG4kKGRvY3VtZW50KS50b29sdGlwKHtzZWxlY3RvcjogXCJbY2xhc3M9J21lZGlhLXRvb2x0aXAnXVwiLHRyaWdnZXI6J2NsaWNrJ30pXHJcblxyXG5hY3RpdmF0ZV90YWIgPSgpIC0+XHJcbiAgJChcIiNmaWVsZFRhYnMgYVtocmVmPScjdGFiI3thY3RpdmVfdGFifSddXCIpLnRhYignc2hvdycpXHJcblxyXG5nb3Zfc2VsZWN0b3Iub25fc2VsZWN0ZWQgPSAoZXZ0LCBkYXRhLCBuYW1lKSAtPlxyXG4gICNyZW5kZXJEYXRhICcjZGV0YWlscycsIGRhdGFcclxuICBnZXRfZWxlY3RlZF9vZmZpY2lhbHMgZGF0YS5faWQsIDI1LCAoZGF0YTIsIHRleHRTdGF0dXMsIGpxWEhSKSAtPlxyXG4gICAgZGF0YS5lbGVjdGVkX29mZmljaWFscyA9IGRhdGEyXHJcbiAgICAkKCcjZGV0YWlscycpLmh0bWwgdGVtcGxhdGVzLmdldF9odG1sKDAsIGRhdGEpXHJcbiAgICAjZ2V0X3JlY29yZCBcImluY19pZDoje2RhdGFbXCJpbmNfaWRcIl19XCJcclxuICAgIGdldF9yZWNvcmQyIGRhdGFbXCJfaWRcIl1cclxuICAgIGFjdGl2YXRlX3RhYigpXHJcbiAgICBHT1ZXSUtJLnNob3dfZGF0YV9wYWdlKClcclxuICAgIHJvdXRlci5uYXZpZ2F0ZShkYXRhLl9pZClcclxuICAgIHJldHVyblxyXG5cclxuXHJcbmdldF9yZWNvcmQgPSAocXVlcnkpIC0+XHJcbiAgJC5hamF4XHJcbiAgICB1cmw6IFwiaHR0cHM6Ly9hcGkubW9uZ29sYWIuY29tL2FwaS8xL2RhdGFiYXNlcy9nb3Z3aWtpL2NvbGxlY3Rpb25zL2dvdnMvP3E9eyN7cXVlcnl9fSZmPXtfaWQ6MH0mbD0xJmFwaUtleT0wWTVYX1FrMnVPSlJkSEpXSktTUldrNmw2SnFWVFMyeVwiXHJcbiAgICBkYXRhVHlwZTogJ2pzb24nXHJcbiAgICBjYWNoZTogdHJ1ZVxyXG4gICAgc3VjY2VzczogKGRhdGEpIC0+XHJcbiAgICAgIGlmIGRhdGEubGVuZ3RoXHJcbiAgICAgICAgJCgnI2RldGFpbHMnKS5odG1sIHRlbXBsYXRlcy5nZXRfaHRtbCgwLCBkYXRhWzBdKVxyXG4gICAgICAgIGFjdGl2YXRlX3RhYigpXHJcbiAgICAgICAgI2dvdm1hcC5nZW9jb2RlIGRhdGFbMF1cclxuICAgICAgcmV0dXJuXHJcbiAgICBlcnJvcjooZSkgLT5cclxuICAgICAgY29uc29sZS5sb2cgZVxyXG5cclxuXHJcbmdldF9yZWNvcmQyID0gKHJlY2lkKSAtPlxyXG4gICQuYWpheFxyXG4gICAgI3VybDogXCJodHRwczovL2RzcC1nb3Z3aWtpLmNsb3VkLmRyZWFtZmFjdG9yeS5jb206NDQzL3Jlc3QvZ292d2lraV9hcGkvZ292cy8je3JlY2lkfVwiXHJcbiAgICB1cmw6IFwiaHR0cDovLzQ2LjEwMS4zLjc5OjgwL3Jlc3QvZGIvZ292cy8je3JlY2lkfVwiXHJcbiAgICBkYXRhVHlwZTogJ2pzb24nXHJcbiAgICBoZWFkZXJzOiB7XCJYLURyZWFtRmFjdG9yeS1BcHBsaWNhdGlvbi1OYW1lXCI6XCJnb3Z3aWtpXCJ9XHJcbiAgICBjYWNoZTogdHJ1ZVxyXG4gICAgc3VjY2VzczogKGRhdGEpIC0+XHJcbiAgICAgIGlmIGRhdGFcclxuICAgICAgICBnZXRfZmluYW5jaWFsX3N0YXRlbWVudHMgZGF0YS5faWQsIChkYXRhMiwgdGV4dFN0YXR1cywganFYSFIpIC0+XHJcbiAgICAgICAgICBkYXRhLmZpbmFuY2lhbF9zdGF0ZW1lbnRzID0gZGF0YTJcclxuICAgICAgICAgIGdldF9lbGVjdGVkX29mZmljaWFscyBkYXRhLl9pZCwgMjUsIChkYXRhMywgdGV4dFN0YXR1czIsIGpxWEhSMikgLT5cclxuICAgICAgICAgICAgZGF0YS5lbGVjdGVkX29mZmljaWFscyA9IGRhdGEzXHJcbiAgICAgICAgICAgICQoJyNkZXRhaWxzJykuaHRtbCB0ZW1wbGF0ZXMuZ2V0X2h0bWwoMCwgZGF0YSlcclxuICAgICAgICAgICAgYWN0aXZhdGVfdGFiKClcclxuICAgICAgICAgICAgI2dvdm1hcC5nZW9jb2RlIGRhdGFbMF1cclxuICAgICAgcmV0dXJuXHJcbiAgICBlcnJvcjooZSkgLT5cclxuICAgICAgY29uc29sZS5sb2cgZVxyXG5cclxuXHJcbmdldF9lbGVjdGVkX29mZmljaWFscyA9IChnb3ZfaWQsIGxpbWl0LCBvbnN1Y2Nlc3MpIC0+XHJcbiAgJC5hamF4XHJcbiAgICB1cmw6XCJodHRwOi8vNDYuMTAxLjMuNzk6ODAvcmVzdC9kYi9lbGVjdGVkX29mZmljaWFsc1wiXHJcbiAgICBkYXRhOlxyXG4gICAgICBmaWx0ZXI6XCJnb3ZzX2lkPVwiICsgZ292X2lkXHJcbiAgICAgIGZpZWxkczpcImdvdnNfaWQsdGl0bGUsZnVsbF9uYW1lLGVtYWlsX2FkZHJlc3MscGhvdG9fdXJsLHRlcm1fZXhwaXJlcyx0ZWxlcGhvbmVfbnVtYmVyXCJcclxuICAgICAgYXBwX25hbWU6XCJnb3Z3aWtpXCJcclxuICAgICAgb3JkZXI6XCJkaXNwbGF5X29yZGVyXCJcclxuICAgICAgbGltaXQ6bGltaXRcclxuXHJcbiAgICBkYXRhVHlwZTogJ2pzb24nXHJcbiAgICBjYWNoZTogdHJ1ZVxyXG4gICAgc3VjY2Vzczogb25zdWNjZXNzXHJcbiAgICBlcnJvcjooZSkgLT5cclxuICAgICAgY29uc29sZS5sb2cgZVxyXG5cclxuZ2V0X2ZpbmFuY2lhbF9zdGF0ZW1lbnRzID0gKGdvdl9pZCwgb25zdWNjZXNzKSAtPlxyXG4gICQuYWpheFxyXG4gICAgdXJsOlwiaHR0cDovLzQ2LjEwMS4zLjc5OjgwL3Jlc3QvZGIvX3Byb2MvZ2V0X2ZpbmFuY2lhbF9zdGF0ZW1lbnRzXCJcclxuICAgIGRhdGE6XHJcbiAgICAgIGFwcF9uYW1lOlwiZ292d2lraVwiXHJcbiAgICAgIG9yZGVyOlwiY2FwdGlvbl9jYXRlZ29yeSxkaXNwbGF5X29yZGVyXCJcclxuICAgICAgcGFyYW1zOiBbXHJcbiAgICAgICAgbmFtZTogXCJnb3ZzX2lkXCJcclxuICAgICAgICBwYXJhbV90eXBlOiBcIklOXCJcclxuICAgICAgICB2YWx1ZTogZ292X2lkXHJcbiAgICAgIF1cclxuXHJcbiAgICBkYXRhVHlwZTogJ2pzb24nXHJcbiAgICBjYWNoZTogdHJ1ZVxyXG4gICAgc3VjY2Vzczogb25zdWNjZXNzXHJcbiAgICBlcnJvcjooZSkgLT5cclxuICAgICAgY29uc29sZS5sb2cgZVxyXG5cclxuXHJcbndpbmRvdy5HT1ZXSUtJLnNob3dfcmVjb3JkID0ocmVjKT0+XHJcbiAgJCgnI2RldGFpbHMnKS5odG1sIHRlbXBsYXRlcy5nZXRfaHRtbCgwLCByZWMpXHJcbiAgYWN0aXZhdGVfdGFiKClcclxuICBHT1ZXSUtJLnNob3dfZGF0YV9wYWdlKClcclxuICByb3V0ZXIubmF2aWdhdGUocmVjLl9pZClcclxuXHJcblxyXG53aW5kb3cuR09WV0lLSS5zaG93X3JlY29yZDIgPShyZWMpPT5cclxuICBnZXRfZWxlY3RlZF9vZmZpY2lhbHMgcmVjLl9pZCwgMjUsIChkYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikgLT5cclxuICAgIHJlYy5lbGVjdGVkX29mZmljaWFscyA9IGRhdGFcclxuICAgICQoJyNkZXRhaWxzJykuaHRtbCB0ZW1wbGF0ZXMuZ2V0X2h0bWwoMCwgcmVjKVxyXG4gICAgZ2V0X3JlY29yZDIgcmVjLl9pZFxyXG4gICAgYWN0aXZhdGVfdGFiKClcclxuICAgIEdPVldJS0kuc2hvd19kYXRhX3BhZ2UoKVxyXG4gICAgcm91dGVyLm5hdmlnYXRlKHJlYy5faWQpXHJcblxyXG5cclxuXHJcbiMjI1xyXG53aW5kb3cuc2hvd19yZWMgPSAocmVjKS0+XHJcbiAgJCgnI2RldGFpbHMnKS5odG1sIHRlbXBsYXRlcy5nZXRfaHRtbCgwLCByZWMpXHJcbiAgYWN0aXZhdGVfdGFiKClcclxuIyMjXHJcblxyXG5idWlsZF9zZWxlY3RvciA9IChjb250YWluZXIsIHRleHQsIGNvbW1hbmQsIHdoZXJlX3RvX3N0b3JlX3ZhbHVlICkgLT5cclxuICAkLmFqYXhcclxuICAgIHVybDogJ2h0dHBzOi8vYXBpLm1vbmdvbGFiLmNvbS9hcGkvMS9kYXRhYmFzZXMvZ292d2lraS9ydW5Db21tYW5kP2FwaUtleT0wWTVYX1FrMnVPSlJkSEpXSktTUldrNmw2SnFWVFMyeSdcclxuICAgIHR5cGU6ICdQT1NUJ1xyXG4gICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvblwiXHJcbiAgICBkYXRhVHlwZTogJ2pzb24nXHJcbiAgICBkYXRhOiBjb21tYW5kICNKU09OLnN0cmluZ2lmeShjb21tYW5kKVxyXG4gICAgY2FjaGU6IHRydWVcclxuICAgIHN1Y2Nlc3M6IChkYXRhKSA9PlxyXG4gICAgICAjYT0kLmV4dGVuZCB0cnVlIFtdLGRhdGFcclxuICAgICAgdmFsdWVzPWRhdGEudmFsdWVzXHJcbiAgICAgIGJ1aWxkX3NlbGVjdF9lbGVtZW50IGNvbnRhaW5lciwgdGV4dCwgdmFsdWVzLnNvcnQoKSwgd2hlcmVfdG9fc3RvcmVfdmFsdWVcclxuICAgICAgcmV0dXJuXHJcbiAgICBlcnJvcjooZSkgLT5cclxuICAgICAgY29uc29sZS5sb2cgZVxyXG5cclxuXHJcbmJ1aWxkX3NlbGVjdF9lbGVtZW50ID0gKGNvbnRhaW5lciwgdGV4dCwgYXJyLCB3aGVyZV90b19zdG9yZV92YWx1ZSApIC0+XHJcbiAgcyAgPSBcIjxzZWxlY3QgY2xhc3M9J2Zvcm0tY29udHJvbCcgc3R5bGU9J21heHdpZHRoOjE2MHB4Oyc+PG9wdGlvbiB2YWx1ZT0nJz4je3RleHR9PC9vcHRpb24+XCJcclxuICBzICs9IFwiPG9wdGlvbiB2YWx1ZT0nI3t2fSc+I3t2fTwvb3B0aW9uPlwiIGZvciB2IGluIGFyciB3aGVuIHZcclxuICBzICs9IFwiPC9zZWxlY3Q+XCJcclxuICBzZWxlY3QgPSAkKHMpXHJcbiAgJChjb250YWluZXIpLmFwcGVuZChzZWxlY3QpXHJcblxyXG4gICMgc2V0IGRlZmF1bHQgJ0NBJ1xyXG4gIGlmIHRleHQgaXMgJ1N0YXRlLi4nXHJcbiAgICBzZWxlY3QudmFsICdDQSdcclxuICAgIHdpbmRvdy5HT1ZXSUtJLnN0YXRlX2ZpbHRlcj0nQ0EnXHJcbiAgICBnb3ZtYXAub25fYm91bmRzX2NoYW5nZWRfbGF0ZXIoKVxyXG5cclxuICBzZWxlY3QuY2hhbmdlIChlKSAtPlxyXG4gICAgZWwgPSAkKGUudGFyZ2V0KVxyXG4gICAgd2luZG93LkdPVldJS0lbd2hlcmVfdG9fc3RvcmVfdmFsdWVdID0gZWwudmFsKClcclxuICAgICQoJy5nb3YtY291bnRlcicpLnRleHQgZ292X3NlbGVjdG9yLmNvdW50X2dvdnMoKVxyXG4gICAgZ292bWFwLm9uX2JvdW5kc19jaGFuZ2VkKClcclxuXHJcblxyXG5hZGp1c3RfdHlwZWFoZWFkX3dpZHRoID0oKSAtPlxyXG4gIGlucCA9ICQoJyNteWlucHV0JylcclxuICBwYXIgPSAkKCcjdHlwZWFoZWQtY29udGFpbmVyJylcclxuICBpbnAud2lkdGggcGFyLndpZHRoKClcclxuXHJcblxyXG5cclxuXHJcbnN0YXJ0X2FkanVzdGluZ190eXBlYWhlYWRfd2lkdGggPSgpIC0+XHJcbiAgJCh3aW5kb3cpLnJlc2l6ZSAtPlxyXG4gICAgYWRqdXN0X3R5cGVhaGVhZF93aWR0aCgpXHJcblxyXG5cclxuIyBhZGQgbGl2ZSByZWxvYWQgdG8gdGhlIHNpdGUuIEZvciBkZXZlbG9wbWVudCBvbmx5LlxyXG5saXZlcmVsb2FkID0gKHBvcnQpIC0+XHJcbiAgdXJsPXdpbmRvdy5sb2NhdGlvbi5vcmlnaW4ucmVwbGFjZSAvOlteOl0qJC8sIFwiXCJcclxuICAkLmdldFNjcmlwdCB1cmwgKyBcIjpcIiArIHBvcnQsID0+XHJcbiAgICAkKCdib2R5JykuYXBwZW5kIFwiXCJcIlxyXG4gICAgPGRpdiBzdHlsZT0ncG9zaXRpb246YWJzb2x1dGU7ei1pbmRleDoxMDAwO1xyXG4gICAgd2lkdGg6MTAwJTsgdG9wOjA7Y29sb3I6cmVkOyB0ZXh0LWFsaWduOiBjZW50ZXI7XHJcbiAgICBwYWRkaW5nOjFweDtmb250LXNpemU6MTBweDtsaW5lLWhlaWdodDoxJz5saXZlPC9kaXY+XHJcbiAgICBcIlwiXCJcclxuXHJcbmZvY3VzX3NlYXJjaF9maWVsZCA9IChtc2VjKSAtPlxyXG4gIHNldFRpbWVvdXQgKC0+ICQoJyNteWlucHV0JykuZm9jdXMoKSkgLG1zZWNcclxuXHJcblxyXG5cclxuIyBxdWljayBhbmQgZGlydHkgZml4IGZvciBiYWNrIGJ1dHRvbiBpbiBicm93c2VyXHJcbndpbmRvdy5vbmhhc2hjaGFuZ2UgPSAoZSkgLT5cclxuICBoPXdpbmRvdy5sb2NhdGlvbi5oYXNoXHJcbiAgI2NvbnNvbGUubG9nIFwib25IYXNoQ2hhbmdlICN7aH1cIlxyXG4gICNjb25zb2xlLmxvZyBlXHJcbiAgaWYgbm90IGhcclxuICAgIEdPVldJS0kuc2hvd19zZWFyY2hfcGFnZSgpXHJcblxyXG4jID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxyXG5cclxuI3RlbXBsYXRlcy5sb2FkX3RlbXBsYXRlIFwidGFic1wiLCBcImNvbmZpZy90YWJsYXlvdXQuanNvblwiXHJcbnRlbXBsYXRlcy5sb2FkX2Z1c2lvbl90ZW1wbGF0ZSBcInRhYnNcIiwgXCJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9mdXNpb250YWJsZXMvdjIvcXVlcnk/c3FsPVNFTEVDVCUyMColMjBGUk9NJTIwMXoyb1hRRVlRM3AyT29NSThWNWdLZ0hXQjVUejk5MEJyUTF4YzF0Vm8ma2V5PUFJemFTeUNYRFF5TURwR0EyZzNRanV2NENEdjd6UmotaXg0SVFKQVwiXHJcblxyXG5idWlsZF9zZWxlY3RvcignLnN0YXRlLWNvbnRhaW5lcicgLCAnU3RhdGUuLicgLCAne1wiZGlzdGluY3RcIjogXCJnb3ZzXCIsXCJrZXlcIjpcInN0YXRlXCJ9JyAsICdzdGF0ZV9maWx0ZXInKVxyXG5idWlsZF9zZWxlY3RvcignLmdvdi10eXBlLWNvbnRhaW5lcicgLCAndHlwZSBvZiBnb3Zlcm5tZW50Li4nICwgJ3tcImRpc3RpbmN0XCI6IFwiZ292c1wiLFwia2V5XCI6XCJnb3ZfdHlwZVwifScgLCAnZ292X3R5cGVfZmlsdGVyJylcclxuXHJcbmFkanVzdF90eXBlYWhlYWRfd2lkdGgoKVxyXG5zdGFydF9hZGp1c3RpbmdfdHlwZWFoZWFkX3dpZHRoKClcclxuXHJcbiQoJyNidG5CYWNrVG9TZWFyY2gnKS5jbGljayAoZSktPlxyXG4gIGUucHJldmVudERlZmF1bHQoKVxyXG4gIEdPVldJS0kuc2hvd19zZWFyY2hfcGFnZSgpXHJcblxyXG4jZm9jdXNfc2VhcmNoX2ZpZWxkIDUwMFxyXG5cclxuXHJcblxyXG5saXZlcmVsb2FkIFwiOTA5MFwiXHJcblxyXG4iLCJcclxuXHJcblxyXG4jIFRha2VzIGFuIGFycmF5IG9mIGRvY3MgdG8gc2VhcmNoIGluLlxyXG4jIFJldHVybnMgYSBmdW5jdGlvbnMgdGhhdCB0YWtlcyAyIHBhcmFtcyBcclxuIyBxIC0gcXVlcnkgc3RyaW5nIGFuZCBcclxuIyBjYiAtIGNhbGxiYWNrIHRoYXQgd2lsbCBiZSBjYWxsZWQgd2hlbiB0aGUgc2VhcmNoIGlzIGRvbmUuXHJcbiMgY2IgcmV0dXJucyBhbiBhcnJheSBvZiBtYXRjaGluZyBkb2N1bWVudHMuXHJcbiMgbXVtX2l0ZW1zIC0gbWF4IG51bWJlciBvZiBmb3VuZCBpdGVtcyB0byBzaG93XHJcblF1ZXJ5TWF0aGVyID0gKGRvY3MsIG51bV9pdGVtcz01KSAtPlxyXG4gIChxLCBjYikgLT5cclxuICAgIHRlc3Rfc3RyaW5nID0ocywgcmVncykgLT5cclxuICAgICAgKGlmIG5vdCByLnRlc3QocykgdGhlbiByZXR1cm4gZmFsc2UpICBmb3IgciBpbiByZWdzXHJcbiAgICAgIHJldHVybiB0cnVlXHJcblxyXG4gICAgW3dvcmRzLHJlZ3NdID0gZ2V0X3dvcmRzX3JlZ3MgcVxyXG4gICAgbWF0Y2hlcyA9IFtdXHJcbiAgICAjIGl0ZXJhdGUgdGhyb3VnaCB0aGUgcG9vbCBvZiBkb2NzIGFuZCBmb3IgYW55IHN0cmluZyB0aGF0XHJcbiAgICAjIGNvbnRhaW5zIHRoZSBzdWJzdHJpbmcgYHFgLCBhZGQgaXQgdG8gdGhlIGBtYXRjaGVzYCBhcnJheVxyXG5cclxuICAgIGZvciBkIGluIGRvY3NcclxuICAgICAgaWYgbWF0Y2hlcy5sZW5ndGggPj0gbnVtX2l0ZW1zIHRoZW4gYnJlYWtcclxuICAgICAgaWYgR09WV0lLSS5zdGF0ZV9maWx0ZXIgYW5kIGQuc3RhdGUgaXNudCBHT1ZXSUtJLnN0YXRlX2ZpbHRlciB0aGVuIGNvbnRpbnVlXHJcbiAgICAgIGlmIEdPVldJS0kuZ292X3R5cGVfZmlsdGVyIGFuZCBkLmdvdl90eXBlIGlzbnQgR09WV0lLSS5nb3ZfdHlwZV9maWx0ZXIgdGhlbiBjb250aW51ZVxyXG5cclxuICAgICAgaWYgdGVzdF9zdHJpbmcoZC5nb3ZfbmFtZSwgcmVncykgXHJcbiAgICAgICAgbWF0Y2hlcy5wdXNoICQuZXh0ZW5kKHt9LCBkKVxyXG4gICAgICAjaWYgdGVzdF9zdHJpbmcoXCIje2QuZ292X25hbWV9ICN7ZC5zdGF0ZX0gI3tkLmdvdl90eXBlfSAje2QuaW5jX2lkfVwiLCByZWdzKSB0aGVuIG1hdGNoZXMucHVzaCAkLmV4dGVuZCh7fSwgZClcclxuICAgIFxyXG4gICAgc2VsZWN0X3RleHQgbWF0Y2hlcywgd29yZHMsIHJlZ3NcclxuICAgIGNiIG1hdGNoZXNcclxuICAgIHJldHVyblxyXG4gXHJcblxyXG4jIGluc2VydHMgPHN0cm9uZz4gZWxlbWVudHNlIGluIGFycmF5XHJcbnNlbGVjdF90ZXh0ID0gKGNsb25lcyx3b3JkcyxyZWdzKSAtPlxyXG4gIGZvciBkIGluIGNsb25lc1xyXG4gICAgZC5nb3ZfbmFtZT1zdHJvbmdpZnkoZC5nb3ZfbmFtZSwgd29yZHMsIHJlZ3MpXHJcbiAgICAjZC5zdGF0ZT1zdHJvbmdpZnkoZC5zdGF0ZSwgd29yZHMsIHJlZ3MpXHJcbiAgICAjZC5nb3ZfdHlwZT1zdHJvbmdpZnkoZC5nb3ZfdHlwZSwgd29yZHMsIHJlZ3MpXHJcbiAgXHJcbiAgcmV0dXJuIGNsb25lc1xyXG5cclxuXHJcblxyXG4jIGluc2VydHMgPHN0cm9uZz4gZWxlbWVudHNlXHJcbnN0cm9uZ2lmeSA9IChzLCB3b3JkcywgcmVncykgLT5cclxuICByZWdzLmZvckVhY2ggKHIsaSkgLT5cclxuICAgIHMgPSBzLnJlcGxhY2UgciwgXCI8Yj4je3dvcmRzW2ldfTwvYj5cIlxyXG4gIHJldHVybiBzXHJcblxyXG4jIHJlbW92ZXMgPD4gdGFncyBmcm9tIGEgc3RyaW5nXHJcbnN0cmlwID0gKHMpIC0+XHJcbiAgcy5yZXBsYWNlKC88W148Pl0qPi9nLCcnKVxyXG5cclxuXHJcbiMgYWxsIHRpcm1zIHNwYWNlcyBmcm9tIGJvdGggc2lkZXMgYW5kIG1ha2UgY29udHJhY3RzIHNlcXVlbmNlcyBvZiBzcGFjZXMgdG8gMVxyXG5mdWxsX3RyaW0gPSAocykgLT5cclxuICBzcz1zLnRyaW0oJycrcylcclxuICBzcz1zcy5yZXBsYWNlKC8gKy9nLCcgJylcclxuXHJcbiMgcmV0dXJucyBhbiBhcnJheSBvZiB3b3JkcyBpbiBhIHN0cmluZ1xyXG5nZXRfd29yZHMgPSAoc3RyKSAtPlxyXG4gIGZ1bGxfdHJpbShzdHIpLnNwbGl0KCcgJylcclxuXHJcblxyXG5nZXRfd29yZHNfcmVncyA9IChzdHIpIC0+XHJcbiAgd29yZHMgPSBnZXRfd29yZHMgc3RyXHJcbiAgcmVncyA9IHdvcmRzLm1hcCAodyktPiBuZXcgUmVnRXhwKFwiI3t3fVwiLCdpJylcclxuICBbd29yZHMscmVnc11cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXJ5TWF0aGVyXHJcblxyXG4iLCJcclxuIyMjXHJcbiMgZmlsZTogdGVtcGxhdGVzMi5jb2ZmZWUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4jXHJcbiMgQ2xhc3MgdG8gbWFuYWdlIHRlbXBsYXRlcyBhbmQgcmVuZGVyIGRhdGEgb24gaHRtbCBwYWdlLlxyXG4jXHJcbiMgVGhlIG1haW4gbWV0aG9kIDogcmVuZGVyKGRhdGEpLCBnZXRfaHRtbChkYXRhKVxyXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4jIyNcclxuXHJcblxyXG5cclxuIyBMT0FEIEZJRUxEIE5BTUVTXHJcbmZpZWxkTmFtZXMgPSB7fVxyXG5maWVsZE5hbWVzSGVscCA9IHt9XHJcblxyXG5cclxucmVuZGVyX2ZpZWxkX3ZhbHVlID0gKG4sbWFzayxkYXRhKSAtPlxyXG4gIHY9ZGF0YVtuXVxyXG4gIGlmIG5vdCBkYXRhW25dXHJcbiAgICByZXR1cm4gJydcclxuXHJcbiAgaWYgbiA9PSBcIndlYl9zaXRlXCJcclxuICAgIHJldHVybiBcIjxhIHRhcmdldD0nX2JsYW5rJyBocmVmPScje3Z9Jz4je3Z9PC9hPlwiXHJcbiAgZWxzZVxyXG4gICAgaWYgJycgIT0gbWFza1xyXG4gICAgICByZXR1cm4gbnVtZXJhbCh2KS5mb3JtYXQobWFzaylcclxuICAgIGVsc2VcclxuICAgICAgaWYgdi5sZW5ndGggPiAyMCBhbmRcclxuICAgICAgbiA9PSBcIm9wZW5fZW5yb2xsbWVudF9zY2hvb2xzXCJcclxuICAgICAgdGhlbiB2ID0gdi5zdWJzdHJpbmcoMCwgMTkpICsgXCI8ZGl2IHN0eWxlPSdkaXNwbGF5OmlubGluZTtjb2xvcjojMDc0ZDcxJyAgdGl0bGU9JyN7dn0nPiZoZWxsaXA7PC9kaXY+XCJcclxuICAgICAgZWxzZVxyXG4gICAgICAgIGlmIHYubGVuZ3RoID4gMjFcclxuICAgICAgICB0aGVuIHYgPSB2LnN1YnN0cmluZygwLCAyMSlcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgcmV0dXJuIHZcclxuXHJcblxyXG5yZW5kZXJfZmllbGRfbmFtZV9oZWxwID0gKGZOYW1lKSAtPlxyXG4gICNpZiBmaWVsZE5hbWVzSGVscFtmTmFtZV1cclxuICAgIHJldHVybiBmaWVsZE5hbWVzSGVscFtmTmFtZV1cclxuXHJcbnJlbmRlcl9maWVsZF9uYW1lID0gKGZOYW1lKSAtPlxyXG4gIGlmIGZpZWxkTmFtZXNbZk5hbWVdP1xyXG4gICAgcmV0dXJuIGZpZWxkTmFtZXNbZk5hbWVdXHJcblxyXG4gIHMgPSBmTmFtZS5yZXBsYWNlKC9fL2csXCIgXCIpXHJcbiAgcyA9IHMuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzLnN1YnN0cmluZygxKVxyXG4gIHJldHVybiBzXHJcblxyXG5cclxucmVuZGVyX2ZpZWxkID0gKGZOYW1lLGRhdGEpLT5cclxuICBpZiBcIl9cIiA9PSBzdWJzdHIgZk5hbWUsIDAsIDFcclxuICAgIFwiXCJcIlxyXG4gICAgPGRpdj5cclxuICAgICAgICA8c3BhbiBjbGFzcz0nZi1uYW0nID4je3JlbmRlcl9maWVsZF9uYW1lIGZOYW1lfTwvc3Bhbj5cclxuICAgICAgICA8c3BhbiBjbGFzcz0nZi12YWwnPiZuYnNwOzwvc3Bhbj5cclxuICAgIDwvZGl2PlxyXG4gICAgXCJcIlwiXHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuICcnIHVubGVzcyBmVmFsdWUgPSBkYXRhW2ZOYW1lXVxyXG4gICAgXCJcIlwiXHJcbiAgICA8ZGl2PlxyXG4gICAgICAgIDxzcGFuIGNsYXNzPSdmLW5hbScgID4je3JlbmRlcl9maWVsZF9uYW1lIGZOYW1lfTxkaXY+PC9zcGFuPlxyXG4gICAgICAgIDxzcGFuIGNsYXNzPSdmLXZhbCc+I3tyZW5kZXJfZmllbGRfdmFsdWUoZk5hbWUsZGF0YSl9PC9zcGFuPlxyXG4gICAgPC9kaXY+XHJcbiAgICBcIlwiXCJcclxuXHJcbnJlbmRlcl9zdWJoZWFkaW5nID0gKGZOYW1lLCBtYXNrLCBub3RGaXJzdCktPlxyXG4gIHMgPSAnJ1xyXG4gIGZOYW1lID0gcmVuZGVyX2ZpZWxkX25hbWUgZk5hbWVcclxuICBpZiBtYXNrID09IFwiaGVhZGluZ1wiXHJcbiAgICBpZiBub3RGaXJzdCAhPSAwXHJcbiAgICAgIHMgKz0gXCI8YnIvPlwiXHJcbiAgICBzICs9IFwiPGRpdj48c3BhbiBjbGFzcz0nZi1uYW0nPiN7Zk5hbWV9PC9zcGFuPjxzcGFuIGNsYXNzPSdmLXZhbCc+IDwvc3Bhbj48L2Rpdj5cIlxyXG4gIHJldHVybiBzXHJcblxyXG5yZW5kZXJfZmllbGRzID0gKGZpZWxkcyxkYXRhLHRlbXBsYXRlKS0+XHJcbiAgaCA9ICcnXHJcbiAgZm9yIGZpZWxkLGkgaW4gZmllbGRzXHJcbiAgICBpZiAodHlwZW9mIGZpZWxkIGlzIFwib2JqZWN0XCIpXHJcbiAgICAgIGlmIGZpZWxkLm1hc2sgPT0gXCJoZWFkaW5nXCJcclxuICAgICAgICBoICs9IHJlbmRlcl9zdWJoZWFkaW5nKGZpZWxkLm5hbWUsIGZpZWxkLm1hc2ssIGkpXHJcbiAgICAgICAgZlZhbHVlID0gJydcclxuICAgICAgZWxzZVxyXG4gICAgICAgIGZWYWx1ZSA9IHJlbmRlcl9maWVsZF92YWx1ZSBmaWVsZC5uYW1lLCBmaWVsZC5tYXNrLCBkYXRhXHJcbiAgICAgICAgaWYgKCcnICE9IGZWYWx1ZSBhbmQgZlZhbHVlICE9ICcwJylcclxuICAgICAgICAgIGZOYW1lID0gcmVuZGVyX2ZpZWxkX25hbWUgZmllbGQubmFtZVxyXG4gICAgICAgICAgZk5hbWVIZWxwID0gcmVuZGVyX2ZpZWxkX25hbWVfaGVscCBmaWVsZC5uYW1lXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgZlZhbHVlID0gJydcclxuXHJcbiAgICBlbHNlXHJcbiAgICAgIGZWYWx1ZSA9IHJlbmRlcl9maWVsZF92YWx1ZSBmaWVsZCwgJycsIGRhdGFcclxuICAgICAgaWYgKCcnICE9IGZWYWx1ZSlcclxuICAgICAgICBmTmFtZSA9IHJlbmRlcl9maWVsZF9uYW1lIGZpZWxkXHJcbiAgICAgICAgZk5hbWVIZWxwID0gcmVuZGVyX2ZpZWxkX25hbWVfaGVscCBmTmFtZVxyXG4gICAgaWYgKCcnICE9IGZWYWx1ZSlcclxuICAgICAgaCArPSB0ZW1wbGF0ZShuYW1lOiBmTmFtZSwgdmFsdWU6IGZWYWx1ZSwgaGVscDogZk5hbWVIZWxwKVxyXG4gIHJldHVybiBoXHJcblxyXG5yZW5kZXJfZmluYW5jaWFsX2ZpZWxkcyA9IChkYXRhLHRlbXBsYXRlKS0+XHJcbiAgaCA9ICcnXHJcbiAgbWFzayA9ICcwLDAnXHJcbiAgY2F0ZWdvcnkgPSAnJ1xyXG4gIGZvciBmaWVsZCBpbiBkYXRhXHJcbiAgICBpZiBjYXRlZ29yeSAhPSBmaWVsZC5jYXRlZ29yeV9uYW1lXHJcbiAgICAgIGNhdGVnb3J5ID0gZmllbGQuY2F0ZWdvcnlfbmFtZVxyXG4gICAgICBpZiBjYXRlZ29yeSA9PSAnT3ZlcnZpZXcnXHJcbiAgICAgICAgaCArPSB0ZW1wbGF0ZShuYW1lOiBcIjxiPlwiICsgY2F0ZWdvcnkgKyBcIjwvYj5cIiwgZ2VuZnVuZDogJycsIG90aGVyZnVuZHM6ICcnLCB0b3RhbGZ1bmRzOiAnJylcclxuICAgICAgZWxzZSBpZiBjYXRlZ29yeSA9PSAnUmV2ZW51ZXMnXHJcbiAgICAgICAgaCArPSAnPC9icj4nXHJcbiAgICAgICAgaCArPSBcIjxiPlwiICsgdGVtcGxhdGUobmFtZTogY2F0ZWdvcnksIGdlbmZ1bmQ6IFwiR2VuZXJhbCBGdW5kXCIsIG90aGVyZnVuZHM6IFwiT3RoZXIgRnVuZHNcIiwgdG90YWxmdW5kczogXCJUb3RhbCBHb3YuIEZ1bmRzXCIpICsgXCI8L2I+XCJcclxuICAgICAgZWxzZVxyXG4gICAgICAgIGggKz0gJzwvYnI+J1xyXG4gICAgICAgIGggKz0gdGVtcGxhdGUobmFtZTogXCI8Yj5cIiArIGNhdGVnb3J5ICsgXCI8L2I+XCIsIGdlbmZ1bmQ6ICcnLCBvdGhlcmZ1bmRzOiAnJywgdG90YWxmdW5kczogJycpXHJcblxyXG4gICAgZmllbGRzX3dpdGhfZG9sbGFyX3NpZ24gPSBbJ1RheGVzJywgJ0NhcGl0YWwgT3V0bGF5JywgJ1RvdGFsIFJldmVudWVzJywgJ1RvdGFsIEV4cGVuZGl0dXJlcycsICdTdXJwbHVzIC8gKERlZmljaXQpJ11cclxuICAgIGlmIGZpZWxkLmNhcHRpb24gPT0gJ0dlbmVyYWwgRnVuZCBCYWxhbmNlJyBvciBmaWVsZC5jYXB0aW9uID09ICdMb25nIFRlcm0gRGVidCdcclxuICAgICAgaCArPSB0ZW1wbGF0ZShuYW1lOiBmaWVsZC5jYXB0aW9uLCBnZW5mdW5kOiBjdXJyZW5jeShmaWVsZC5nZW5mdW5kLCBtYXNrLCAnPHNwYW4gY2xhc3M9XCJjdXJyZW5jeS1zaWduXCI+JDwvc3Bhbj4nKSlcclxuICAgIGVsc2UgaWYgZmllbGQuY2FwdGlvbiBpbiBmaWVsZHNfd2l0aF9kb2xsYXJfc2lnblxyXG4gICAgICBoICs9IHRlbXBsYXRlKG5hbWU6IGZpZWxkLmNhcHRpb24sIGdlbmZ1bmQ6IGN1cnJlbmN5KGZpZWxkLmdlbmZ1bmQsIG1hc2ssICc8c3BhbiBjbGFzcz1cImN1cnJlbmN5LXNpZ25cIj4kPC9zcGFuPicpLCBvdGhlcmZ1bmRzOiBjdXJyZW5jeShmaWVsZC5vdGhlcmZ1bmRzLCBtYXNrLCAnPHNwYW4gY2xhc3M9XCJjdXJyZW5jeS1zaWduXCI+JDwvc3Bhbj4nKSwgdG90YWxmdW5kczogY3VycmVuY3koZmllbGQudG90YWxmdW5kcywgbWFzaywgJzxzcGFuIGNsYXNzPVwiY3VycmVuY3ktc2lnblwiPiQ8L3NwYW4+JykpXHJcbiAgICBlbHNlXHJcbiAgICAgIGggKz0gdGVtcGxhdGUobmFtZTogZmllbGQuY2FwdGlvbiwgZ2VuZnVuZDogY3VycmVuY3koZmllbGQuZ2VuZnVuZCwgbWFzayksIG90aGVyZnVuZHM6IGN1cnJlbmN5KGZpZWxkLm90aGVyZnVuZHMsIG1hc2spLCB0b3RhbGZ1bmRzOiBjdXJyZW5jeShmaWVsZC50b3RhbGZ1bmRzLCBtYXNrKSlcclxuICByZXR1cm4gaFxyXG5cclxudW5kZXIgPSAocykgLT4gcy5yZXBsYWNlKC9bXFxzXFwrXFwtXS9nLCAnXycpXHJcblxyXG50b1RpdGxlQ2FzZSA9IChzdHIpIC0+XHJcbiAgc3RyLnJlcGxhY2UgL1xcd1xcUyovZywgKHR4dCkgLT5cclxuICAgIHR4dC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHR4dC5zdWJzdHIoMSkudG9Mb3dlckNhc2UoKVxyXG5cclxuY3VycmVuY3kgPSAobiwgbWFzaywgc2lnbiA9ICcnKSAtPlxyXG4gICAgbiA9IG51bWVyYWwobilcclxuICAgIGlmIG4gPCAwXHJcbiAgICAgICAgcyA9IG4uZm9ybWF0KG1hc2spLnRvU3RyaW5nKClcclxuICAgICAgICBzID0gcy5yZXBsYWNlKC8tL2csICcnKVxyXG4gICAgICAgIHJldHVybiBcIigje3NpZ259I3snPHNwYW4gY2xhc3M9XCJmaW4tdmFsXCI+JytzKyc8L3NwYW4+J30pXCJcclxuXHJcbiAgICBuID0gbi5mb3JtYXQobWFzaylcclxuICAgIHJldHVybiBcIiN7c2lnbn0jeyc8c3BhbiBjbGFzcz1cImZpbi12YWxcIj4nK24rJzwvc3Bhbj4nfVwiXHJcblxyXG5yZW5kZXJfdGFicyA9IChpbml0aWFsX2xheW91dCwgZGF0YSwgdGFic2V0LCBwYXJlbnQpIC0+XHJcbiAgI2xheW91dCA9IGFkZF9vdGhlcl90YWJfdG9fbGF5b3V0IGluaXRpYWxfbGF5b3V0LCBkYXRhXHJcbiAgbGF5b3V0ID0gaW5pdGlhbF9sYXlvdXRcclxuICB0ZW1wbGF0ZXMgPSBwYXJlbnQudGVtcGxhdGVzXHJcbiAgcGxvdF9oYW5kbGVzID0ge31cclxuXHJcbiAgbGF5b3V0X2RhdGEgPVxyXG4gICAgdGl0bGU6IGRhdGEuZ292X25hbWVcclxuICAgIHdpa2lwZWRpYV9wYWdlX2V4aXN0czogZGF0YS53aWtpcGVkaWFfcGFnZV9leGlzdHNcclxuICAgIHdpa2lwZWRpYV9wYWdlX25hbWU6ICBkYXRhLndpa2lwZWRpYV9wYWdlX25hbWVcclxuICAgIHRyYW5zcGFyZW50X2NhbGlmb3JuaWFfcGFnZV9uYW1lOiBkYXRhLnRyYW5zcGFyZW50X2NhbGlmb3JuaWFfcGFnZV9uYW1lXHJcbiAgICBsYXRlc3RfYXVkaXRfdXJsOiBkYXRhLmxhdGVzdF9hdWRpdF91cmxcclxuICAgIHRhYnM6IFtdXHJcbiAgICB0YWJjb250ZW50OiAnJ1xyXG5cclxuICBmb3IgdGFiLGkgaW4gbGF5b3V0XHJcbiAgICBsYXlvdXRfZGF0YS50YWJzLnB1c2hcclxuICAgICAgdGFiaWQ6IHVuZGVyKHRhYi5uYW1lKSxcclxuICAgICAgdGFibmFtZTogdGFiLm5hbWUsXHJcbiAgICAgIGFjdGl2ZTogKGlmIGk+MCB0aGVuICcnIGVsc2UgJ2FjdGl2ZScpXHJcblxyXG4gIGZvciB0YWIsaSBpbiBsYXlvdXRcclxuICAgIGRldGFpbF9kYXRhID1cclxuICAgICAgdGFiaWQ6IHVuZGVyKHRhYi5uYW1lKSxcclxuICAgICAgdGFibmFtZTogdGFiLm5hbWUsXHJcbiAgICAgIGFjdGl2ZTogKGlmIGk+MCB0aGVuICcnIGVsc2UgJ2FjdGl2ZScpXHJcbiAgICAgIHRhYmNvbnRlbnQ6ICcnXHJcbiAgICBzd2l0Y2ggdGFiLm5hbWVcclxuICAgICAgd2hlbiAnT3ZlcnZpZXcgKyBFbGVjdGVkIE9mZmljaWFscydcclxuICAgICAgICBkZXRhaWxfZGF0YS50YWJjb250ZW50ICs9IHJlbmRlcl9maWVsZHMgdGFiLmZpZWxkcywgZGF0YSwgdGVtcGxhdGVzWyd0YWJkZXRhaWwtbmFtZXZhbHVlLXRlbXBsYXRlJ11cclxuICAgICAgICBmb3Igb2ZmaWNpYWwsaSBpbiBkYXRhLmVsZWN0ZWRfb2ZmaWNpYWxzLnJlY29yZFxyXG4gICAgICAgICAgb2ZmaWNpYWxfZGF0YSA9XHJcbiAgICAgICAgICAgIHRpdGxlOiBpZiAnJyAhPSBvZmZpY2lhbC50aXRsZSB0aGVuIFwiVGl0bGU6IFwiICsgb2ZmaWNpYWwudGl0bGVcclxuICAgICAgICAgICAgbmFtZTogaWYgJycgIT0gb2ZmaWNpYWwuZnVsbF9uYW1lIHRoZW4gXCJOYW1lOiBcIiArIG9mZmljaWFsLmZ1bGxfbmFtZVxyXG4gICAgICAgICAgICBlbWFpbDogaWYgbnVsbCAhPSBvZmZpY2lhbC5lbWFpbF9hZGRyZXNzIHRoZW4gXCJFbWFpbDogXCIgKyBvZmZpY2lhbC5lbWFpbF9hZGRyZXNzXHJcbiAgICAgICAgICAgIHRlbGVwaG9uZW51bWJlcjogaWYgbnVsbCAhPSBvZmZpY2lhbC50ZWxlcGhvbmVfbnVtYmVyIGFuZCB1bmRlZmluZWQgIT0gb2ZmaWNpYWwudGVsZXBob25lX251bWJlciB0aGVuIFwiVGVsZXBob25lIE51bWJlcjogXCIgKyBvZmZpY2lhbC50ZWxlcGhvbmVfbnVtYmVyXHJcbiAgICAgICAgICAgIHRlcm1leHBpcmVzOiBpZiBudWxsICE9IG9mZmljaWFsLnRlcm1fZXhwaXJlcyB0aGVuIFwiVGVybSBFeHBpcmVzOiBcIiArIG9mZmljaWFsLnRlcm1fZXhwaXJlc1xyXG5cclxuICAgICAgICAgIGlmICcnICE9IG9mZmljaWFsLnBob3RvX3VybCBhbmQgb2ZmaWNpYWwucGhvdG9fdXJsICE9IG51bGwgdGhlbiBvZmZpY2lhbF9kYXRhLmltYWdlID0gICc8aW1nIHNyYz1cIicrb2ZmaWNpYWwucGhvdG9fdXJsKydcIiBjbGFzcz1cInBvcnRyYWl0XCIgYWx0PVwiXCIgLz4nXHJcbiAgICAgICAgICBkZXRhaWxfZGF0YS50YWJjb250ZW50ICs9IHRlbXBsYXRlc1sndGFiZGV0YWlsLW9mZmljaWFsLXRlbXBsYXRlJ10ob2ZmaWNpYWxfZGF0YSlcclxuICAgICAgd2hlbiAnRW1wbG95ZWUgQ29tcGVuc2F0aW9uJ1xyXG4gICAgICAgIGggPSAnJ1xyXG4gICAgICAgIGggKz0gcmVuZGVyX2ZpZWxkcyB0YWIuZmllbGRzLCBkYXRhLCB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC1uYW1ldmFsdWUtdGVtcGxhdGUnXVxyXG4gICAgICAgIGRldGFpbF9kYXRhLnRhYmNvbnRlbnQgKz0gdGVtcGxhdGVzWyd0YWJkZXRhaWwtZW1wbG95ZWUtY29tcC10ZW1wbGF0ZSddKGNvbnRlbnQ6IGgpXHJcbiAgICAgICAgaWYgbm90IHBsb3RfaGFuZGxlc1snbWVkaWFuLWNvbXAtZ3JhcGgnXVxyXG4gICAgICAgICAgZ3JhcGggPSB0cnVlXHJcbiAgICAgICAgICBpZiBkYXRhWydtZWRpYW5fc2FsYXJ5X3Blcl9mdWxsX3RpbWVfZW1wJ10gPT0gMFxyXG4gICAgICAgICAgICBncmFwaCA9IGZhbHNlXHJcbiAgICAgICAgICBpZiBkYXRhWydtZWRpYW5fYmVuZWZpdHNfcGVyX2Z0X2VtcCddID09IDBcclxuICAgICAgICAgICAgZ3JhcGggPSBmYWxzZVxyXG4gICAgICAgICAgaWYgZGF0YVsnbWVkaWFuX3dhZ2VzX2dlbmVyYWxfcHVibGljJ10gPT0gMFxyXG4gICAgICAgICAgICBncmFwaCA9IGZhbHNlXHJcbiAgICAgICAgICBpZiBkYXRhWydtZWRpYW5fYmVuZWZpdHNfZ2VuZXJhbF9wdWJsaWMnXSA9PSAwXHJcbiAgICAgICAgICAgIGdyYXBoID0gZmFsc2VcclxuICAgICAgICAgIGRyYXdDaGFydCA9ICgpIC0+XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQgKCAtPlxyXG4gICAgICAgICAgICAgIHZpc19kYXRhID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLkRhdGFUYWJsZSgpXHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdzdHJpbmcnLCAnTWVkaWFuIENvbXBlbnNhdGlvbidcclxuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRDb2x1bW4gJ251bWJlcicsICdXYWdlcydcclxuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRDb2x1bW4gJ251bWJlcicsICdCZW5zLidcclxuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRSb3dzIFtcclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgdG9UaXRsZUNhc2UgZGF0YS5nb3ZfbmFtZSArICdcXG4gRW1wbG95ZWVzJ1xyXG4gICAgICAgICAgICAgICAgICBkYXRhWydtZWRpYW5fc2FsYXJ5X3Blcl9mdWxsX3RpbWVfZW1wJ11cclxuICAgICAgICAgICAgICAgICAgZGF0YVsnbWVkaWFuX2JlbmVmaXRzX3Blcl9mdF9lbXAnXVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICAnQWxsIFxcbicgKyB0b1RpdGxlQ2FzZSBkYXRhLmdvdl9uYW1lICsgJyBcXG4gUmVzaWRlbnRzJ1xyXG4gICAgICAgICAgICAgICAgICBkYXRhWydtZWRpYW5fd2FnZXNfZ2VuZXJhbF9wdWJsaWMnXVxyXG4gICAgICAgICAgICAgICAgICBkYXRhWydtZWRpYW5fYmVuZWZpdHNfZ2VuZXJhbF9wdWJsaWMnXVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICBmb3JtYXR0ZXIgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uTnVtYmVyRm9ybWF0KGdyb3VwaW5nU3ltYm9sOiAnLCcgLCBmcmFjdGlvbkRpZ2l0czogJzAnKVxyXG4gICAgICAgICAgICAgIGZvcm1hdHRlci5mb3JtYXQodmlzX2RhdGEsIDEpO1xyXG4gICAgICAgICAgICAgIGZvcm1hdHRlci5mb3JtYXQodmlzX2RhdGEsIDIpO1xyXG4gICAgICAgICAgICAgIG9wdGlvbnMgPVxyXG4gICAgICAgICAgICAgICAgJ3RpdGxlJzonTWVkaWFuIFRvdGFsIENvbXBlbnNhdGlvbiAtIEZ1bGwgVGltZSBXb3JrZXJzOiBcXG4gR292ZXJubWVudCB2cy4gUHJpdmF0ZSBTZWN0b3InXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAzNDBcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAzMDBcclxuICAgICAgICAgICAgICAgICdpc1N0YWNrZWQnOiAndHJ1ZSdcclxuICAgICAgICAgICAgICAgICdjb2xvcnMnOiBbJyMwMDVjZTYnLCAnIzAwOTkzMyddXHJcbiAgICAgICAgICAgICAgY2hhcnQgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uQ29sdW1uQ2hhcnQgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgJ21lZGlhbi1jb21wLWdyYXBoJ1xyXG4gICAgICAgICAgICAgIGNoYXJ0LmRyYXcgdmlzX2RhdGEsIG9wdGlvbnNcclxuICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgKSwgMTAwMFxyXG4gICAgICAgICAgaWYgZ3JhcGhcclxuICAgICAgICAgICAgZ29vZ2xlLmxvYWQgJ3Zpc3VhbGl6YXRpb24nLCAnMS4wJyxcclxuICAgICAgICAgICAgJ2NhbGxiYWNrJyA6IGRyYXdDaGFydCgpXHJcbiAgICAgICAgICAgICdwYWNrYWdlcycgOidjb3JlY2hhcnQnXHJcbiAgICAgICAgICBwbG90X2hhbmRsZXNbJ21lZGlhbi1jb21wLWdyYXBoJ10gPSdtZWRpYW4tY29tcC1ncmFwaCdcclxuICAgICAgICBpZiBub3QgcGxvdF9oYW5kbGVzWydtZWRpYW4tcGVuc2lvbi1ncmFwaCddXHJcbiAgICAgICAgICBncmFwaCA9IHRydWVcclxuICAgICAgICAgIGlmIGRhdGFbJ21lZGlhbl9wZW5zaW9uXzMwX3llYXJfcmV0aXJlZSddID09IDBcclxuICAgICAgICAgICAgZ3JhcGggPSBmYWxzZVxyXG4gICAgICAgICAgZHJhd0NoYXJ0ID0gKCkgLT5cclxuICAgICAgICAgICAgc2V0VGltZW91dCAoIC0+XHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uRGF0YVRhYmxlKClcclxuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRDb2x1bW4gJ3N0cmluZycsICdNZWRpYW4gUGVuc2lvbidcclxuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRDb2x1bW4gJ251bWJlcicsICdXYWdlcydcclxuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRSb3dzIFtcclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgJ1BlbnNpb24gZm9yIFxcbiBSZXRpcmVlIHcvIDMwIFllYXJzJ1xyXG4gICAgICAgICAgICAgICAgICBkYXRhWydtZWRpYW5fcGVuc2lvbl8zMF95ZWFyX3JldGlyZWUnXVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICBmb3JtYXR0ZXIgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uTnVtYmVyRm9ybWF0KGdyb3VwaW5nU3ltYm9sOiAnLCcgLCBmcmFjdGlvbkRpZ2l0czogJzAnKVxyXG4gICAgICAgICAgICAgIGZvcm1hdHRlci5mb3JtYXQodmlzX2RhdGEsIDEpO1xyXG4gICAgICAgICAgICAgIG9wdGlvbnMgPVxyXG4gICAgICAgICAgICAgICAgJ3RpdGxlJzonTWVkaWFuIFRvdGFsIFBlbnNpb24nXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAzNDBcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAzMDBcclxuICAgICAgICAgICAgICAgICdpc1N0YWNrZWQnOiAndHJ1ZSdcclxuICAgICAgICAgICAgICAgICdjb2xvcnMnOiBbJyMwMDVjZTYnLCAnIzAwOTkzMyddXHJcbiAgICAgICAgICAgICAgICAnY2hhcnRBcmVhLndpZHRoJzogJzUwJSdcclxuICAgICAgICAgICAgICBpZiBncmFwaFxyXG4gICAgICAgICAgICAgICAgY2hhcnQgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uQ29sdW1uQ2hhcnQgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgJ21lZGlhbi1wZW5zaW9uLWdyYXBoJ1xyXG4gICAgICAgICAgICAgICAgY2hhcnQuZHJhdyB2aXNfZGF0YSwgb3B0aW9uc1xyXG4gICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICApLCAxMDAwXHJcbiAgICAgICAgICBnb29nbGUubG9hZCAndmlzdWFsaXphdGlvbicsICcxLjAnLFxyXG4gICAgICAgICAgJ2NhbGxiYWNrJyA6IGRyYXdDaGFydCgpXHJcbiAgICAgICAgICAncGFja2FnZXMnIDonY29yZWNoYXJ0J1xyXG4gICAgICAgICAgcGxvdF9oYW5kbGVzWydtZWRpYW4tcGVuc2lvbi1ncmFwaCddID0nbWVkaWFuLXBlbnNpb24tZ3JhcGgnXHJcbiAgICAgIHdoZW4gJ0ZpbmFuY2lhbCBIZWFsdGgnXHJcbiAgICAgICAgaCA9ICcnXHJcbiAgICAgICAgaCArPSByZW5kZXJfZmllbGRzIHRhYi5maWVsZHMsIGRhdGEsIHRlbXBsYXRlc1sndGFiZGV0YWlsLW5hbWV2YWx1ZS10ZW1wbGF0ZSddXHJcbiAgICAgICAgZGV0YWlsX2RhdGEudGFiY29udGVudCArPSB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC1maW5hbmNpYWwtaGVhbHRoLXRlbXBsYXRlJ10oY29udGVudDogaClcclxuICAgICAgICAjcHVibGljIHNhZmV0eSBwaWVcclxuICAgICAgICBpZiBub3QgcGxvdF9oYW5kbGVzWydwdWJsaWMtc2FmZXR5LXBpZSddXHJcbiAgICAgICAgICBncmFwaCA9IHRydWVcclxuICAgICAgICAgIGlmIGRhdGFbJ3B1YmxpY19zYWZldHlfZXhwX292ZXJfdG90X2dvdl9mdW5kX3JldmVudWUnXSA9PSAwXHJcbiAgICAgICAgICAgIGdyYXBoID0gZmFsc2VcclxuICAgICAgICAgIGRyYXdDaGFydCA9ICgpIC0+XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQgKCAtPlxyXG4gICAgICAgICAgICAgIHZpc19kYXRhID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLkRhdGFUYWJsZSgpXHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdzdHJpbmcnLCAnUHVibGljIFNhZmV0eSBFeHBlbnNlJ1xyXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnbnVtYmVyJywgJ1RvdGFsJ1xyXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZFJvd3MgW1xyXG4gICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICAnUHVibGljIFNhZmV0eSBFeHBlbnNlJ1xyXG4gICAgICAgICAgICAgICAgICAxMDAgLSBkYXRhWydwdWJsaWNfc2FmZXR5X2V4cF9vdmVyX3RvdF9nb3ZfZnVuZF9yZXZlbnVlJ11cclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgJ090aGVyIEdvdmVybm1lbnRhbCBcXG4gRnVuZCBSZXZlbnVlJ1xyXG4gICAgICAgICAgICAgICAgICBkYXRhWydwdWJsaWNfc2FmZXR5X2V4cF9vdmVyX3RvdF9nb3ZfZnVuZF9yZXZlbnVlJ11cclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgb3B0aW9ucyA9XHJcbiAgICAgICAgICAgICAgICAndGl0bGUnOidQdWJsaWMgc2FmZXR5IGV4cGVuc2UnXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAzNDBcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAzMDBcclxuICAgICAgICAgICAgICAgICdpczNEJyA6ICd0cnVlJ1xyXG4gICAgICAgICAgICAgICAgJ2NvbG9ycyc6IFsnIzAwNWNlNicsICcjMDA5OTMzJ11cclxuICAgICAgICAgICAgICAgICdzbGljZXMnOiB7IDE6IHtvZmZzZXQ6IDAuMn19XHJcbiAgICAgICAgICAgICAgICAncGllU3RhcnRBbmdsZSc6IDIwXHJcbiAgICAgICAgICAgICAgY2hhcnQgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uUGllQ2hhcnQgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgJ3B1YmxpYy1zYWZldHktcGllJ1xyXG4gICAgICAgICAgICAgIGNoYXJ0LmRyYXcgdmlzX2RhdGEsIG9wdGlvbnNcclxuICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgKSwgMTAwMFxyXG4gICAgICAgICAgaWYgZ3JhcGhcclxuICAgICAgICAgICAgZ29vZ2xlLmxvYWQgJ3Zpc3VhbGl6YXRpb24nLCAnMS4wJyxcclxuICAgICAgICAgICAgJ2NhbGxiYWNrJyA6IGRyYXdDaGFydCgpXHJcbiAgICAgICAgICAgICdwYWNrYWdlcycgOidjb3JlY2hhcnQnXHJcbiAgICAgICAgICBwbG90X2hhbmRsZXNbJ3B1YmxpYy1zYWZldHktcGllJ10gPSdwdWJsaWMtc2FmZXR5LXBpZSdcclxuICAgICAgICAjZmluLWhlYWx0aC1yZXZlbnVlIGdyYXBoXHJcbiAgICAgICAgaWYgbm90IHBsb3RfaGFuZGxlc1snZmluLWhlYWx0aC1yZXZlbnVlLWdyYXBoJ11cclxuICAgICAgICAgIGdyYXBoID0gdHJ1ZVxyXG4gICAgICAgICAgaWYgZGF0YVsndG90YWxfcmV2ZW51ZV9wZXJfY2FwaXRhJ10gPT0gMFxyXG4gICAgICAgICAgICBncmFwaCA9IGZhbHNlXHJcbiAgICAgICAgICBkcmF3Q2hhcnQgPSAoKSAtPlxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0ICggLT5cclxuICAgICAgICAgICAgICB2aXNfZGF0YSA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5EYXRhVGFibGUoKVxyXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnc3RyaW5nJywgJ1BlciBDYXBpdGEnXHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdudW1iZXInLCAnUmV2LidcclxuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRSb3dzIFtcclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgJ1RvdGFsIFJldmVudWUgXFxuIFBlciBDYXBpdGEnXHJcbiAgICAgICAgICAgICAgICAgIGRhdGFbJ3RvdGFsX3JldmVudWVfcGVyX2NhcGl0YSddXHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICdNZWRpYW4gVG90YWwgUmV2ZW51ZSBQZXIgXFxuIENhcGl0YSBGb3IgQWxsIENpdGllcydcclxuICAgICAgICAgICAgICAgICAgNDIwXHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgIG9wdGlvbnMgPVxyXG4gICAgICAgICAgICAgICAgJ3RpdGxlJzonVG90YWwgUmV2ZW51ZSdcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6IDM0MFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6IDMwMFxyXG4gICAgICAgICAgICAgICAgJ2lzU3RhY2tlZCc6ICd0cnVlJ1xyXG4gICAgICAgICAgICAgICAgJ2NvbG9ycyc6IFsnIzAwNWNlNicsICcjMDA5OTMzJ11cclxuICAgICAgICAgICAgICAgICdjaGFydEFyZWEud2lkdGgnOiAnNTAlJ1xyXG4gICAgICAgICAgICAgIGNoYXJ0ID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLkNvbHVtbkNoYXJ0IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICdmaW4taGVhbHRoLXJldmVudWUtZ3JhcGgnXHJcbiAgICAgICAgICAgICAgY2hhcnQuZHJhdyB2aXNfZGF0YSwgb3B0aW9uc1xyXG4gICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICApLCAxMDAwXHJcbiAgICAgICAgICBpZiBncmFwaFxyXG4gICAgICAgICAgICBnb29nbGUubG9hZCAndmlzdWFsaXphdGlvbicsICcxLjAnLFxyXG4gICAgICAgICAgICAnY2FsbGJhY2snIDogZHJhd0NoYXJ0KClcclxuICAgICAgICAgICAgJ3BhY2thZ2VzJyA6J2NvcmVjaGFydCdcclxuICAgICAgICAgIHBsb3RfaGFuZGxlc1snZmluLWhlYWx0aC1yZXZlbnVlLWdyYXBoJ10gPSdmaW4taGVhbHRoLXJldmVudWUtZ3JhcGgnXHJcbiAgICAgICAgI2Zpbi1oZWFsdGgtZXhwZW5kaXR1cmVzLWdyYXBoXHJcbiAgICAgICAgaWYgbm90IHBsb3RfaGFuZGxlc1snZmluLWhlYWx0aC1leHBlbmRpdHVyZXMtZ3JhcGgnXVxyXG4gICAgICAgICAgZ3JhcGggPSB0cnVlXHJcbiAgICAgICAgICBpZiBkYXRhWyd0b3RhbF9leHBlbmRpdHVyZXNfcGVyX2NhcGl0YSddID09IDBcclxuICAgICAgICAgICAgZ3JhcGggPSBmYWxzZVxyXG4gICAgICAgICAgZHJhd0NoYXJ0ID0gKCkgLT5cclxuICAgICAgICAgICAgc2V0VGltZW91dCAoIC0+XHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uRGF0YVRhYmxlKClcclxuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRDb2x1bW4gJ3N0cmluZycsICdQZXIgQ2FwaXRhJ1xyXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnbnVtYmVyJywgJ0V4cC4nXHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkUm93cyBbXHJcbiAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICdUb3RhbCBFeHBlbmRpdHVyZXMgXFxuIFBlciBDYXBpdGEnXHJcbiAgICAgICAgICAgICAgICAgIGRhdGFbJ3RvdGFsX2V4cGVuZGl0dXJlc19wZXJfY2FwaXRhJ11cclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgJ01lZGlhbiBUb3RhbCBcXG4gRXhwZW5kaXR1cmVzIFBlciBDYXBpdGEgXFxuIEZvciBBbGwgQ2l0aWVzJ1xyXG4gICAgICAgICAgICAgICAgICA0MjBcclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgb3B0aW9ucyA9XHJcbiAgICAgICAgICAgICAgICAndGl0bGUnOidUb3RhbCBFeHBlbmRpdHVyZXMnXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAzNDBcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAzMDBcclxuICAgICAgICAgICAgICAgICdpc1N0YWNrZWQnOiAndHJ1ZSdcclxuICAgICAgICAgICAgICAgICdjb2xvcnMnOiBbJyMwMDVjZTYnLCAnIzAwOTkzMyddXHJcbiAgICAgICAgICAgICAgICAnY2hhcnRBcmVhLndpZHRoJzogJzUwJSdcclxuICAgICAgICAgICAgICBpZiBncmFwaFxyXG4gICAgICAgICAgICAgICAgY2hhcnQgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uQ29sdW1uQ2hhcnQgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgJ2Zpbi1oZWFsdGgtZXhwZW5kaXR1cmVzLWdyYXBoJ1xyXG4gICAgICAgICAgICAgICAgY2hhcnQuZHJhdyB2aXNfZGF0YSwgb3B0aW9uc1xyXG4gICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICApLCAxMDAwXHJcbiAgICAgICAgICBnb29nbGUubG9hZCAndmlzdWFsaXphdGlvbicsICcxLjAnLFxyXG4gICAgICAgICAgJ2NhbGxiYWNrJyA6IGRyYXdDaGFydCgpXHJcbiAgICAgICAgICAncGFja2FnZXMnIDonY29yZWNoYXJ0J1xyXG4gICAgICAgICAgcGxvdF9oYW5kbGVzWydmaW4taGVhbHRoLWV4cGVuZGl0dXJlcy1ncmFwaCddID0nZmluLWhlYWx0aC1leHBlbmRpdHVyZXMtZ3JhcGgnXHJcbiAgICAgIHdoZW4gJ0ZpbmFuY2lhbCBTdGF0ZW1lbnRzJ1xyXG4gICAgICAgIGlmIGRhdGEuZmluYW5jaWFsX3N0YXRlbWVudHNcclxuICAgICAgICAgIGggPSAnJ1xyXG4gICAgICAgICAgI2ggKz0gcmVuZGVyX2ZpZWxkcyB0YWIuZmllbGRzLCBkYXRhLCB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC1uYW1ldmFsdWUtdGVtcGxhdGUnXVxyXG4gICAgICAgICAgaCArPSByZW5kZXJfZmluYW5jaWFsX2ZpZWxkcyBkYXRhLmZpbmFuY2lhbF9zdGF0ZW1lbnRzLCB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC1maW5zdGF0ZW1lbnQtdGVtcGxhdGUnXVxyXG4gICAgICAgICAgZGV0YWlsX2RhdGEudGFiY29udGVudCArPSB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC1maW5hbmNpYWwtc3RhdGVtZW50cy10ZW1wbGF0ZSddKGNvbnRlbnQ6IGgpXHJcbiAgICAgICAgICAjdGFiZGV0YWlsLWZpbmFuY2lhbC1zdGF0ZW1lbnRzLXRlbXBsYXRlXHJcbiAgICAgICAgICBpZiBub3QgcGxvdF9oYW5kbGVzWyd0b3RhbC1leHBlbmRpdHVyZXMtcGllJ11cclxuICAgICAgICAgICAgZ3JhcGggPSB0cnVlXHJcbiAgICAgICAgICAgIGlmIGRhdGEuZmluYW5jaWFsX3N0YXRlbWVudHMubGVuZ3RoID09IDBcclxuICAgICAgICAgICAgICBncmFwaCA9IGZhbHNlXHJcbiAgICAgICAgICAgIGRyYXdDaGFydCA9ICgpIC0+XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQgKCAtPlxyXG4gICAgICAgICAgICAgIHZpc19kYXRhID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLkRhdGFUYWJsZSgpXHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdzdHJpbmcnLCAnVG90YWwgR292LiBFeHBlbmRpdHVyZXMnXHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdudW1iZXInLCAnVG90YWwnXHJcblxyXG4gICAgICAgICAgICAgIHJvd3MgPSBbXVxyXG4gICAgICAgICAgICAgIGZvciBpdGVtIGluIGRhdGEuZmluYW5jaWFsX3N0YXRlbWVudHNcclxuICAgICAgICAgICAgICAgIGlmIChpdGVtLmNhdGVnb3J5X25hbWUgaXMgXCJFeHBlbmRpdHVyZXNcIikgYW5kIChpdGVtLmNhcHRpb24gaXNudCBcIlRvdGFsIEV4cGVuZGl0dXJlc1wiKVxyXG5cclxuICAgICAgICAgICAgICAgICAgciA9IFtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLmNhcHRpb25cclxuICAgICAgICAgICAgICAgICAgICBwYXJzZUludCBpdGVtLnRvdGFsZnVuZHNcclxuICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgICByb3dzLnB1c2gocilcclxuXHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkUm93cyByb3dzXHJcbiAgICAgICAgICAgICAgb3B0aW9ucyA9XHJcbiAgICAgICAgICAgICAgICAndGl0bGUnOidUb3RhbCBFeHBlbmRpdHVyZXMnXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiA0MDBcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAzNTBcclxuICAgICAgICAgICAgICAgICdwaWVTdGFydEFuZ2xlJzogMjBcclxuICAgICAgICAgICAgICAgICMnaXMzRCcgOiAndHJ1ZSdcclxuICAgICAgICAgICAgICBpZiBncmFwaFxyXG4gICAgICAgICAgICAgICAgY2hhcnQgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uUGllQ2hhcnQgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgJ3RvdGFsLWV4cGVuZGl0dXJlcy1waWUnXHJcbiAgICAgICAgICAgICAgICBjaGFydC5kcmF3IHZpc19kYXRhLCBvcHRpb25zXHJcbiAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgICksIDEwMDBcclxuICAgICAgICAgIGlmIGdyYXBoXHJcbiAgICAgICAgICAgIGdvb2dsZS5sb2FkICd2aXN1YWxpemF0aW9uJywgJzEuMCcsXHJcbiAgICAgICAgICAgICdjYWxsYmFjaycgOiBkcmF3Q2hhcnQoKVxyXG4gICAgICAgICAgICAncGFja2FnZXMnIDonY29yZWNoYXJ0J1xyXG4gICAgICAgICAgcGxvdF9oYW5kbGVzWyd0b3RhbC1leHBlbmRpdHVyZXMtcGllJ10gPSd0b3RhbC1leHBlbmRpdHVyZXMtcGllJ1xyXG4gICAgICBlbHNlXHJcbiAgICAgICAgZGV0YWlsX2RhdGEudGFiY29udGVudCArPSByZW5kZXJfZmllbGRzIHRhYi5maWVsZHMsIGRhdGEsIHRlbXBsYXRlc1sndGFiZGV0YWlsLW5hbWV2YWx1ZS10ZW1wbGF0ZSddXHJcblxyXG4gICAgbGF5b3V0X2RhdGEudGFiY29udGVudCArPSB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC10ZW1wbGF0ZSddKGRldGFpbF9kYXRhKVxyXG4gIHJldHVybiB0ZW1wbGF0ZXNbJ3RhYnBhbmVsLXRlbXBsYXRlJ10obGF5b3V0X2RhdGEpXHJcblxyXG5cclxuZ2V0X2xheW91dF9maWVsZHMgPSAobGEpIC0+XHJcbiAgZiA9IHt9XHJcbiAgZm9yIHQgaW4gbGFcclxuICAgIGZvciBmaWVsZCBpbiB0LmZpZWxkc1xyXG4gICAgICBmW2ZpZWxkXSA9IDFcclxuICByZXR1cm4gZlxyXG5cclxuZ2V0X3JlY29yZF9maWVsZHMgPSAocikgLT5cclxuICBmID0ge31cclxuICBmb3IgZmllbGRfbmFtZSBvZiByXHJcbiAgICBmW2ZpZWxkX25hbWVdID0gMVxyXG4gIHJldHVybiBmXHJcblxyXG5nZXRfdW5tZW50aW9uZWRfZmllbGRzID0gKGxhLCByKSAtPlxyXG4gIGxheW91dF9maWVsZHMgPSBnZXRfbGF5b3V0X2ZpZWxkcyBsYVxyXG4gIHJlY29yZF9maWVsZHMgPSBnZXRfcmVjb3JkX2ZpZWxkcyByXHJcbiAgdW5tZW50aW9uZWRfZmllbGRzID0gW11cclxuICB1bm1lbnRpb25lZF9maWVsZHMucHVzaChmKSBmb3IgZiBvZiByZWNvcmRfZmllbGRzIHdoZW4gbm90IGxheW91dF9maWVsZHNbZl1cclxuICByZXR1cm4gdW5tZW50aW9uZWRfZmllbGRzXHJcblxyXG5cclxuYWRkX290aGVyX3RhYl90b19sYXlvdXQgPSAobGF5b3V0PVtdLCBkYXRhKSAtPlxyXG4gICNjbG9uZSB0aGUgbGF5b3V0XHJcbiAgbCA9ICQuZXh0ZW5kIHRydWUsIFtdLCBsYXlvdXRcclxuICB0ID1cclxuICAgIG5hbWU6IFwiT3RoZXJcIlxyXG4gICAgZmllbGRzOiBnZXRfdW5tZW50aW9uZWRfZmllbGRzIGwsIGRhdGFcclxuXHJcbiAgbC5wdXNoIHRcclxuICByZXR1cm4gbFxyXG5cclxuXHJcbiMgY29udmVydHMgdGFiIHRlbXBsYXRlIGRlc2NyaWJlZCBpbiBnb29nbGUgZnVzaW9uIHRhYmxlIHRvXHJcbiMgdGFiIHRlbXBsYXRlXHJcbmNvbnZlcnRfZnVzaW9uX3RlbXBsYXRlPSh0ZW1wbCkgLT5cclxuICB0YWJfaGFzaD17fVxyXG4gIHRhYnM9W11cclxuICAjIHJldHVybnMgaGFzaCBvZiBmaWVsZCBuYW1lcyBhbmQgdGhlaXIgcG9zaXRpb25zIGluIGFycmF5IG9mIGZpZWxkIG5hbWVzXHJcbiAgZ2V0X2NvbF9oYXNoID0gKGNvbHVtbnMpIC0+XHJcbiAgICBjb2xfaGFzaCA9e31cclxuICAgIGNvbF9oYXNoW2NvbF9uYW1lXT1pIGZvciBjb2xfbmFtZSxpIGluIHRlbXBsLmNvbHVtbnNcclxuICAgIHJldHVybiBjb2xfaGFzaFxyXG5cclxuICAjIHJldHVybnMgZmllbGQgdmFsdWUgYnkgaXRzIG5hbWUsIGFycmF5IG9mIGZpZWxkcywgYW5kIGhhc2ggb2YgZmllbGRzXHJcbiAgdmFsID0gKGZpZWxkX25hbWUsIGZpZWxkcywgY29sX2hhc2gpIC0+XHJcbiAgICBmaWVsZHNbY29sX2hhc2hbZmllbGRfbmFtZV1dXHJcblxyXG4gICMgY29udmVydHMgaGFzaCB0byBhbiBhcnJheSB0ZW1wbGF0ZVxyXG4gIGhhc2hfdG9fYXJyYXkgPShoYXNoKSAtPlxyXG4gICAgYSA9IFtdXHJcbiAgICBmb3IgayBvZiBoYXNoXHJcbiAgICAgIHRhYiA9IHt9XHJcbiAgICAgIHRhYi5uYW1lPWtcclxuICAgICAgdGFiLmZpZWxkcz1oYXNoW2tdXHJcbiAgICAgIGEucHVzaCB0YWJcclxuICAgIHJldHVybiBhXHJcblxyXG5cclxuICBjb2xfaGFzaCA9IGdldF9jb2xfaGFzaCh0ZW1wbC5jb2xfaGFzaClcclxuICBwbGFjZWhvbGRlcl9jb3VudCA9IDBcclxuXHJcbiAgZm9yIHJvdyxpIGluIHRlbXBsLnJvd3NcclxuICAgIGNhdGVnb3J5ID0gdmFsICdnZW5lcmFsX2NhdGVnb3J5Jywgcm93LCBjb2xfaGFzaFxyXG4gICAgI3RhYl9oYXNoW2NhdGVnb3J5XT1bXSB1bmxlc3MgdGFiX2hhc2hbY2F0ZWdvcnldXHJcbiAgICBmaWVsZG5hbWUgPSB2YWwgJ2ZpZWxkX25hbWUnLCByb3csIGNvbF9oYXNoXHJcbiAgICBpZiBub3QgZmllbGRuYW1lIHRoZW4gZmllbGRuYW1lID0gXCJfXCIgKyBTdHJpbmcgKytwbGFjZWhvbGRlcl9jb3VudFxyXG4gICAgZmllbGROYW1lc1t2YWwgJ2ZpZWxkX25hbWUnLCByb3csIGNvbF9oYXNoXT12YWwgJ2Rlc2NyaXB0aW9uJywgcm93LCBjb2xfaGFzaFxyXG4gICAgZmllbGROYW1lc0hlbHBbZmllbGRuYW1lXSA9IHZhbCAnaGVscF90ZXh0Jywgcm93LCBjb2xfaGFzaFxyXG4gICAgaWYgY2F0ZWdvcnlcclxuICAgICAgdGFiX2hhc2hbY2F0ZWdvcnldPz1bXVxyXG4gICAgICB0YWJfaGFzaFtjYXRlZ29yeV0ucHVzaCBuOiB2YWwoJ24nLCByb3csIGNvbF9oYXNoKSwgbmFtZTogZmllbGRuYW1lLCBtYXNrOiB2YWwoJ21hc2snLCByb3csIGNvbF9oYXNoKVxyXG5cclxuICBjYXRlZ29yaWVzID0gT2JqZWN0LmtleXModGFiX2hhc2gpXHJcbiAgY2F0ZWdvcmllc19zb3J0ID0ge31cclxuICBmb3IgY2F0ZWdvcnkgaW4gY2F0ZWdvcmllc1xyXG4gICAgaWYgbm90IGNhdGVnb3JpZXNfc29ydFtjYXRlZ29yeV1cclxuICAgICAgY2F0ZWdvcmllc19zb3J0W2NhdGVnb3J5XSA9IHRhYl9oYXNoW2NhdGVnb3J5XVswXS5uXHJcbiAgICBmaWVsZHMgPSBbXVxyXG4gICAgZm9yIG9iaiBpbiB0YWJfaGFzaFtjYXRlZ29yeV1cclxuICAgICAgZmllbGRzLnB1c2ggb2JqXHJcbiAgICBmaWVsZHMuc29ydCAoYSxiKSAtPlxyXG4gICAgICByZXR1cm4gYS5uIC0gYi5uXHJcbiAgICB0YWJfaGFzaFtjYXRlZ29yeV0gPSBmaWVsZHNcclxuXHJcbiAgY2F0ZWdvcmllc19hcnJheSA9IFtdXHJcbiAgZm9yIGNhdGVnb3J5LCBuIG9mIGNhdGVnb3JpZXNfc29ydFxyXG4gICAgY2F0ZWdvcmllc19hcnJheS5wdXNoIGNhdGVnb3J5OiBjYXRlZ29yeSwgbjogblxyXG4gIGNhdGVnb3JpZXNfYXJyYXkuc29ydCAoYSxiKSAtPlxyXG4gICAgcmV0dXJuIGEubiAtIGIublxyXG5cclxuICB0YWJfbmV3aGFzaCA9IHt9XHJcbiAgZm9yIGNhdGVnb3J5IGluIGNhdGVnb3JpZXNfYXJyYXlcclxuICAgIHRhYl9uZXdoYXNoW2NhdGVnb3J5LmNhdGVnb3J5XSA9IHRhYl9oYXNoW2NhdGVnb3J5LmNhdGVnb3J5XVxyXG5cclxuICB0YWJzID0gaGFzaF90b19hcnJheSh0YWJfbmV3aGFzaClcclxuICByZXR1cm4gdGFic1xyXG5cclxuXHJcbmNsYXNzIFRlbXBsYXRlczJcclxuXHJcbiAgQGxpc3QgPSB1bmRlZmluZWRcclxuICBAdGVtcGxhdGVzID0gdW5kZWZpbmVkXHJcbiAgQGRhdGEgPSB1bmRlZmluZWRcclxuICBAZXZlbnRzID0gdW5kZWZpbmVkXHJcblxyXG4gIGNvbnN0cnVjdG9yOigpIC0+XHJcbiAgICBAbGlzdCA9IFtdXHJcbiAgICBAZXZlbnRzID0ge31cclxuICAgIHRlbXBsYXRlTGlzdCA9IFsndGFicGFuZWwtdGVtcGxhdGUnLCAndGFiZGV0YWlsLXRlbXBsYXRlJywgJ3RhYmRldGFpbC1uYW1ldmFsdWUtdGVtcGxhdGUnLCAndGFiZGV0YWlsLWZpbnN0YXRlbWVudC10ZW1wbGF0ZScsICd0YWJkZXRhaWwtb2ZmaWNpYWwtdGVtcGxhdGUnLCAndGFiZGV0YWlsLWVtcGxveWVlLWNvbXAtdGVtcGxhdGUnLCAndGFiZGV0YWlsLWZpbmFuY2lhbC1oZWFsdGgtdGVtcGxhdGUnLCAndGFiZGV0YWlsLWZpbmFuY2lhbC1zdGF0ZW1lbnRzLXRlbXBsYXRlJ11cclxuICAgIHRlbXBsYXRlUGFydGlhbHMgPSBbJ3RhYi10ZW1wbGF0ZSddXHJcbiAgICBAdGVtcGxhdGVzID0ge31cclxuICAgIGZvciB0ZW1wbGF0ZSxpIGluIHRlbXBsYXRlTGlzdFxyXG4gICAgICBAdGVtcGxhdGVzW3RlbXBsYXRlXSA9IEhhbmRsZWJhcnMuY29tcGlsZSgkKCcjJyArIHRlbXBsYXRlKS5odG1sKCkpXHJcbiAgICBmb3IgdGVtcGxhdGUsaSBpbiB0ZW1wbGF0ZVBhcnRpYWxzXHJcbiAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJQYXJ0aWFsKHRlbXBsYXRlLCAkKCcjJyArIHRlbXBsYXRlKS5odG1sKCkpXHJcblxyXG4gIGFkZF90ZW1wbGF0ZTogKGxheW91dF9uYW1lLCBsYXlvdXRfanNvbikgLT5cclxuICAgIEBsaXN0LnB1c2hcclxuICAgICAgcGFyZW50OnRoaXNcclxuICAgICAgbmFtZTpsYXlvdXRfbmFtZVxyXG4gICAgICByZW5kZXI6KGRhdCkgLT5cclxuICAgICAgICBAcGFyZW50LmRhdGEgPSBkYXRcclxuICAgICAgICByZW5kZXJfdGFicyhsYXlvdXRfanNvbiwgZGF0LCB0aGlzLCBAcGFyZW50KVxyXG4gICAgICBiaW5kOiAodHBsX25hbWUsIGNhbGxiYWNrKSAtPlxyXG4gICAgICAgIGlmIG5vdCBAcGFyZW50LmV2ZW50c1t0cGxfbmFtZV1cclxuICAgICAgICAgIEBwYXJlbnQuZXZlbnRzW3RwbF9uYW1lXSA9IFtjYWxsYmFja11cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICBAcGFyZW50LmV2ZW50c1t0cGxfbmFtZV0ucHVzaCBjYWxsYmFja1xyXG4gICAgICBhY3RpdmF0ZTogKHRwbF9uYW1lKSAtPlxyXG4gICAgICAgIGlmIEBwYXJlbnQuZXZlbnRzW3RwbF9uYW1lXVxyXG4gICAgICAgICAgZm9yIGUsaSBpbiBAcGFyZW50LmV2ZW50c1t0cGxfbmFtZV1cclxuICAgICAgICAgICAgZSB0cGxfbmFtZSwgQHBhcmVudC5kYXRhXHJcblxyXG4gIGxvYWRfdGVtcGxhdGU6KHRlbXBsYXRlX25hbWUsIHVybCkgLT5cclxuICAgICQuYWpheFxyXG4gICAgICB1cmw6IHVybFxyXG4gICAgICBkYXRhVHlwZTogJ2pzb24nXHJcbiAgICAgIGNhY2hlOiB0cnVlXHJcbiAgICAgIHN1Y2Nlc3M6ICh0ZW1wbGF0ZV9qc29uKSA9PlxyXG4gICAgICAgIEBhZGRfdGVtcGxhdGUodGVtcGxhdGVfbmFtZSwgdGVtcGxhdGVfanNvbilcclxuICAgICAgICByZXR1cm5cclxuXHJcbiAgbG9hZF9mdXNpb25fdGVtcGxhdGU6KHRlbXBsYXRlX25hbWUsIHVybCkgLT5cclxuICAgICQuYWpheFxyXG4gICAgICB1cmw6IHVybFxyXG4gICAgICBkYXRhVHlwZTogJ2pzb24nXHJcbiAgICAgIGNhY2hlOiB0cnVlXHJcbiAgICAgIHN1Y2Nlc3M6ICh0ZW1wbGF0ZV9qc29uKSA9PlxyXG4gICAgICAgIHQgPSBjb252ZXJ0X2Z1c2lvbl90ZW1wbGF0ZSB0ZW1wbGF0ZV9qc29uXHJcbiAgICAgICAgQGFkZF90ZW1wbGF0ZSh0ZW1wbGF0ZV9uYW1lLCB0KVxyXG4gICAgICAgIHJldHVyblxyXG5cclxuXHJcbiAgZ2V0X25hbWVzOiAtPlxyXG4gICAgKHQubmFtZSBmb3IgdCBpbiBAbGlzdClcclxuXHJcbiAgZ2V0X2luZGV4X2J5X25hbWU6IChuYW1lKSAtPlxyXG4gICAgZm9yIHQsaSBpbiBAbGlzdFxyXG4gICAgICBpZiB0Lm5hbWUgaXMgbmFtZVxyXG4gICAgICAgIHJldHVybiBpXHJcbiAgICAgcmV0dXJuIC0xXHJcblxyXG4gIGdldF9odG1sOiAoaW5kLCBkYXRhKSAtPlxyXG4gICAgaWYgKGluZCBpcyAtMSkgdGhlbiByZXR1cm4gIFwiXCJcclxuXHJcbiAgICBpZiBAbGlzdFtpbmRdXHJcbiAgICAgIHJldHVybiBAbGlzdFtpbmRdLnJlbmRlcihkYXRhKVxyXG4gICAgZWxzZVxyXG4gICAgICByZXR1cm4gXCJcIlxyXG5cclxuICBhY3RpdmF0ZTogKGluZCwgdHBsX25hbWUpIC0+XHJcbiAgICBpZiBAbGlzdFtpbmRdXHJcbiAgICAgIEBsaXN0W2luZF0uYWN0aXZhdGUgdHBsX25hbWVcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVGVtcGxhdGVzMlxyXG4iXX0=
