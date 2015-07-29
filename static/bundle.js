(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var add_marker, bounds_timeout, clear, create_info_window, geocode, geocode_addr, get_icon, get_records, get_records2, map, on_bounds_changed, on_bounds_changed_later, pinImage, rebuild_filter,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

bounds_timeout = void 0;

map = new GMaps({
  el: '#govmap',
  lat: 37,
  lng: -119,
  zoom: 6,
  minZoom: 6,
  scrollwheel: true,
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
  $('#legend li:not(.counties-trigger)').on('click', function() {
    var hidden_field, value;
    $(this).toggleClass('active');
    hidden_field = $(this).find('input');
    value = hidden_field.val();
    hidden_field.val(value === '1' ? '0' : '1');
    return rebuild_filter();
  });
  return $('#legend li.counties-trigger').on('click', function() {
    $(this).toggleClass('active');
    if ($(this).hasClass('active')) {
      return GOVWIKI.get_counties(GOVWIKI.draw_polygons);
    } else {
      return map.removePolygons();
    }
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
      fillOpacity: 1,
      fillColor: color,
      strokeWeight: 1,
      strokeColor: 'white',
      scale: 6
    };
  };
  switch (gov_type) {
    case 'General Purpose':
      return _circle('red');
    case 'School District':
      return _circle('lightblue');
    case 'Dependent School System':
      return _circle('lightblue');
    default:
      return _circle('purple');
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
      fields: "_id,inc_id,gov_name,gov_type,city,zip,state,latitude,longitude,alt_name",
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
var GovSelector, Templates2, activate_tab, active_tab, adjust_typeahead_width, build_select_element, build_selector, draw_polygons, focus_search_field, get_counties, get_elected_officials, get_financial_statements, get_max_ranks, get_record, get_record2, gov_selector, govmap, livereload, router, start_adjusting_typeahead_width, templates;

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

$.get("texts/intro-text.html", function(data) {
  return $("#intro-text").html(data);
});

router = new Grapnel;

router.get(':id', function(req) {
  var build_data, elected_officials, get_elected_officials, id;
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
  if (isNaN(id)) {
    id = id.replace(/_/g, ' ');
    build_data = function(id, limit, onsuccess) {
      return $.ajax({
        url: "http://46.101.3.79:80/rest/db/govs",
        data: {
          filter: "alt_name='" + id + "'",
          app_name: "govwiki"
        },
        dataType: 'json',
        cache: true,
        success: function(data) {
          var elected_officials;
          return elected_officials = get_elected_officials(data.record[0]._id, 25, function(elected_officials_data, textStatus, jqXHR) {
            var gov_id;
            gov_id = data.record[0]._id;
            data = new Object();
            data._id = gov_id;
            data.elected_officials = elected_officials_data;
            data.gov_name = "";
            data.gov_type = "";
            data.state = "";
            $('#details').html(templates.get_html(0, data));
            get_record2(data._id);
            activate_tab();
            GOVWIKI.show_data_page();
          });
        },
        error: function(e) {
          return console.log(e);
        }
      });
    };
    return build_data(id);
  } else {
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
  }
});

GOVWIKI.get_counties = get_counties = function(callback) {
  return $.ajax({
    url: 'data/county_geography_ca.json',
    dataType: 'json',
    cache: true,
    success: function(countiesJSON) {
      return callback(countiesJSON);
    }
  });
};

GOVWIKI.draw_polygons = draw_polygons = function(countiesJSON) {
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
      altName: county.properties.alt_name,
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
        return router.navigate("" + this.countyId);
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
    $('.fin-values-block [data-col="1"]').find('.fin-val').each(function() {
      var thisFinValWidth;
      thisFinValWidth = $(this).width();
      if (thisFinValWidth > finValWidthMax1) {
        return finValWidthMax1 = thisFinValWidth;
      }
    });
    $('.fin-values-block [data-col="2"]').find('.fin-val').each(function() {
      var thisFinValWidth;
      thisFinValWidth = $(this).width();
      if (thisFinValWidth > finValWidthMax2) {
        return finValWidthMax2 = thisFinValWidth;
      }
    });
    $('.fin-values-block [data-col="3"]').find('.fin-val').each(function() {
      var thisFinValWidth;
      thisFinValWidth = $(this).width();
      if (thisFinValWidth > finValWidthMax3) {
        return finValWidthMax3 = thisFinValWidth;
      }
    });
    $('.fin-values-block [data-col="1"] .currency-sign').css('right', finValWidthMax1 + 27);
    $('.fin-values-block [data-col="2"] .currency-sign').css('right', finValWidthMax2 + 27);
    return $('.fin-values-block [data-col="3"] .currency-sign').css('right', finValWidthMax3 + 27);
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
    router.navigate("" + data._id);
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
            return get_max_ranks(function(max_ranks_response) {
              data.max_ranks = max_ranks_response.record[0];
              $('#details').html(templates.get_html(0, data));
              return activate_tab();
            });
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

get_max_ranks = function(onsuccess) {
  return $.ajax({
    url: 'http://46.101.3.79:80/rest/db/max_ranks',
    data: {
      app_name: 'govwiki'
    },
    dataType: 'json',
    cache: true,
    success: onsuccess
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
      return router.navigate("" + (rec.alt_name.replace(/ /g, '_')));
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
var Templates2, add_other_tab_to_layout, convert_fusion_template, currency, fieldNames, fieldNamesHelp, get_layout_fields, get_record_fields, get_unmentioned_fields, render_field, render_field_name, render_field_name_help, render_field_value, render_fields, render_financial_fields, render_subheading, render_tabs, toTitleCase, under;

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
      if (data[n + '_rank'] && data.max_ranks && data.max_ranks[n + '_max_rank']) {
        v = numeral(v).format(mask);
        return v + " <span class='rank'>(" + data[n + '_rank'] + " of " + data.max_ranks[n + '_max_rank'] + ")</span>";
      }
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
  var category, field, h, is_first_row, j, len, mask, ref;
  h = '';
  mask = '0,0';
  category = '';
  is_first_row = false;
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
        is_first_row = true;
      } else {
        h += '</br>';
        h += template({
          name: "<b>" + category + "</b>",
          genfund: '',
          otherfunds: '',
          totalfunds: ''
        });
        is_first_row = true;
      }
    }
    if (field.caption === 'General Fund Balance' || field.caption === 'Long Term Debt') {
      h += template({
        name: field.caption,
        genfund: currency(field.genfund, mask, '<span class="currency-sign">$</span>')
      });
    } else if (((ref = field.caption) === 'Total Revenues' || ref === 'Total Expenditures' || ref === 'Surplus / (Deficit)') || is_first_row) {
      h += template({
        name: field.caption,
        genfund: currency(field.genfund, mask, '<span class="currency-sign">$</span>'),
        otherfunds: currency(field.otherfunds, mask, '<span class="currency-sign">$</span>'),
        totalfunds: currency(field.totalfunds, mask, '<span class="currency-sign">$</span>')
      });
      is_first_row = false;
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
        if (!plot_handles['public-safety-pie'] && data['alt_type'] !== 'School District') {
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
              vis_data.addRows([['Public Safety Exp', 1 - data['public_safety_exp_over_tot_gov_fund_revenue']], ['Other', data['public_safety_exp_over_tot_gov_fund_revenue']]]);
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
                'pieStartAngle': 45
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
        if (!plot_handles['fin-health-revenue-graph'] && data['alt_type'] !== 'School District') {
          graph = true;
          console.log('###al' + JSON.stringify(data));
          if (data['total_revenue_per_capita'] === 0) {
            graph = false;
          }
          drawChart = function() {
            return setTimeout((function() {
              var chart, options, vis_data;
              vis_data = new google.visualization.DataTable();
              vis_data.addColumn('string', 'Per Capita');
              vis_data.addColumn('number', 'Rev.');
              vis_data.addRows([['Total Revenue \n Per Capita', data['total_revenue_per_capita']], ['Median Total \n Revenue Per \n Capita For All Cities', 420]]);
              options = {
                'title': 'Total Revenue',
                'width': 470,
                'height': 300,
                'isStacked': 'true',
                'colors': ['#005ce6', '#009933'],
                'chartArea.width': '100%'
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
        if (!plot_handles['fin-health-expenditures-graph'] && data['alt_type'] !== 'School District') {
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
              vis_data.addRows([['Total Expenditures \n Per Capita', data['total_expenditures_per_capita']], ['Median Total \n Expenditures \n Per Capita \n For All Cities', 420]]);
              options = {
                'title': 'Total Expenditures',
                'width': 470,
                'height': 300,
                'isStacked': 'true',
                'colors': ['#005ce6', '#009933'],
                'chartArea.width': '100%'
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
          if (!plot_handles['total-revenue-pie']) {
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
                console.log('@@@@' + JSON.stringify(item));
                if ((item.category_name === "Revenues") && (item.caption !== "Total Revenues")) {
                  r = [item.caption, parseInt(item.totalfunds)];
                  rows.push(r);
                }
              }
              vis_data.addRows(rows);
              options = {
                'title': 'Total Revenues',
                'width': 400,
                'height': 350,
                'pieStartAngle': 60,
                'sliceVisibilityThreshold': .05,
                'forceIFrame': true,
                'chartArea': {
                  width: '90%',
                  height: '75%'
                }
              };
              if (graph) {
                chart = new google.visualization.PieChart(document.getElementById('total-revenue-pie'));
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
          plot_handles['total-revenue-pie'] = 'total-revenue-pie';
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
                'pieStartAngle': 60,
                'sliceVisibilityThreshold': .05,
                'forceIFrame': true,
                'chartArea': {
                  width: '90%',
                  height: '75%'
                }
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiRDpcXFByb2plY3RzXFxnb3Z3aWtpLWRldi51c1xcY29mZmVlXFxnb3ZtYXAuY29mZmVlIiwiRDpcXFByb2plY3RzXFxnb3Z3aWtpLWRldi51c1xcY29mZmVlXFxnb3ZzZWxlY3Rvci5jb2ZmZWUiLCJEOlxcUHJvamVjdHNcXGdvdndpa2ktZGV2LnVzXFxjb2ZmZWVcXG1haW4uY29mZmVlIiwiRDpcXFByb2plY3RzXFxnb3Z3aWtpLWRldi51c1xcY29mZmVlXFxxdWVyeW1hdGNoZXIuY29mZmVlIiwiRDpcXFByb2plY3RzXFxnb3Z3aWtpLWRldi51c1xcY29mZmVlXFx0ZW1wbGF0ZXMyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLElBQUEsNExBQUE7RUFBQTs7QUFBQSxjQUFBLEdBQWU7O0FBR2YsR0FBQSxHQUFVLElBQUEsS0FBQSxDQUNSO0VBQUEsRUFBQSxFQUFJLFNBQUo7RUFDQSxHQUFBLEVBQUssRUFETDtFQUVBLEdBQUEsRUFBSyxDQUFDLEdBRk47RUFHQSxJQUFBLEVBQU0sQ0FITjtFQUlBLE9BQUEsRUFBUyxDQUpUO0VBS0EsV0FBQSxFQUFhLElBTGI7RUFNQSxVQUFBLEVBQVksS0FOWjtFQU9BLFdBQUEsRUFBYSxJQVBiO0VBUUEsa0JBQUEsRUFDRTtJQUFBLEtBQUEsRUFBTyxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQXBDO0dBVEY7RUFVQSxjQUFBLEVBQWdCLFNBQUE7V0FDZCx1QkFBQSxDQUF3QixHQUF4QjtFQURjLENBVmhCO0NBRFE7O0FBY1YsR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFTLENBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsU0FBNUIsQ0FBc0MsQ0FBQyxJQUF4RCxDQUE2RCxRQUFRLENBQUMsY0FBVCxD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TjtJQUNSLElBQUcsSUFBQyxDQUFBLElBQUssQ0FBQSxHQUFBLENBQVQ7YUFDRSxJQUFDLENBQUEsSUFBSyxDQUFBLEdBQUEsQ0FBSSxDQUFDLFFBQVgsQ0FBb0IsUUFBcEIsRUFERjs7RUFEUTs7Ozs7O0FBSVosTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiYm91bmRzX3RpbWVvdXQ9dW5kZWZpbmVkXHJcblxyXG5cclxubWFwID0gbmV3IEdNYXBzXHJcbiAgZWw6ICcjZ292bWFwJ1xyXG4gIGxhdDogMzdcclxuICBsbmc6IC0xMTlcclxuICB6b29tOiA2XHJcbiAgbWluWm9vbTogNlxyXG4gIHNjcm9sbHdoZWVsOiB0cnVlXHJcbiAgcGFuQ29udHJvbDogZmFsc2VcclxuICB6b29tQ29udHJvbDogdHJ1ZVxyXG4gIHpvb21Db250cm9sT3B0aW9uczpcclxuICAgIHN0eWxlOiBnb29nbGUubWFwcy5ab29tQ29udHJvbFN0eWxlLlNNQUxMXHJcbiAgYm91bmRzX2NoYW5nZWQ6IC0+XHJcbiAgICBvbl9ib3VuZHNfY2hhbmdlZF9sYXRlciAyMDBcclxuXHJcbm1hcC5tYXAuY29udHJvbHNbZ29vZ2xlLm1hcHMuQ29udHJvbFBvc2l0aW9uLlJJR0hUX1RPUF0ucHVzaChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGVnZW5kJykpXHJcblxyXG4kIC0+XHJcbiAgJCgnI2xlZ2VuZCBsaTpub3QoLmNvdW50aWVzLXRyaWdnZXIpJykub24gJ2NsaWNrJywgLT5cclxuICAgICQodGhpcykudG9nZ2xlQ2xhc3MoJ2FjdGl2ZScpXHJcbiAgICBoaWRkZW5fZmllbGQgPSAkKHRoaXMpLmZpbmQoJ2lucHV0JylcclxuICAgIHZhbHVlID0gaGlkZGVuX2ZpZWxkLnZhbCgpXHJcbiAgICBoaWRkZW5fZmllbGQudmFsKGlmIHZhbHVlID09ICcxJyB0aGVuICcwJyBlbHNlICcxJylcclxuICAgIHJlYnVpbGRfZmlsdGVyKClcclxuXHJcbiAgJCgnI2xlZ2VuZCBsaS5jb3VudGllcy10cmlnZ2VyJykub24gJ2NsaWNrJywgLT5cclxuICAgICQodGhpcykudG9nZ2xlQ2xhc3MoJ2FjdGl2ZScpXHJcbiAgICBpZiAkKHRoaXMpLmhhc0NsYXNzKCdhY3RpdmUnKSB0aGVuIEdPVldJS0kuZ2V0X2NvdW50aWVzIEdPVldJS0kuZHJhd19wb2x5Z29ucyBlbHNlIG1hcC5yZW1vdmVQb2x5Z29ucygpXHJcblxyXG5yZWJ1aWxkX2ZpbHRlciA9IC0+XHJcbiAgaGFyZF9wYXJhbXMgPSBbJ0NpdHknLCAnU2Nob29sIERpc3RyaWN0JywgJ1NwZWNpYWwgRGlzdHJpY3QnXVxyXG4gIEdPVldJS0kuZ292X3R5cGVfZmlsdGVyXzIgPSBbXVxyXG4gICQoJy50eXBlX2ZpbHRlcicpLmVhY2ggKGluZGV4LCBlbGVtZW50KSAtPlxyXG4gICAgaWYgJChlbGVtZW50KS5hdHRyKCduYW1lJykgaW4gaGFyZF9wYXJhbXMgYW5kICQoZWxlbWVudCkudmFsKCkgPT0gJzEnXHJcbiAgICAgIEdPVldJS0kuZ292X3R5cGVfZmlsdGVyXzIucHVzaCAkKGVsZW1lbnQpLmF0dHIoJ25hbWUnKVxyXG4gIG9uX2JvdW5kc19jaGFuZ2VkX2xhdGVyIDM1MFxyXG5cclxub25fYm91bmRzX2NoYW5nZWRfbGF0ZXIgID0gKG1zZWMpICAtPlxyXG4gIGNsZWFyVGltZW91dCBib3VuZHNfdGltZW91dFxyXG4gIGJvdW5kc190aW1lb3V0ID0gc2V0VGltZW91dCBvbl9ib3VuZHNfY2hhbmdlZCwgbXNlY1xyXG5cclxuXHJcbm9uX2JvdW5kc19jaGFuZ2VkID0oZSkgLT5cclxuICBjb25zb2xlLmxvZyBcImJvdW5kc19jaGFuZ2VkXCJcclxuICBiPW1hcC5nZXRCb3VuZHMoKVxyXG4gIHVybF92YWx1ZT1iLnRvVXJsVmFsdWUoKVxyXG4gIG5lPWIuZ2V0Tm9ydGhFYXN0KClcclxuICBzdz1iLmdldFNvdXRoV2VzdCgpXHJcbiAgbmVfbGF0PW5lLmxhdCgpXHJcbiAgbmVfbG5nPW5lLmxuZygpXHJcbiAgc3dfbGF0PXN3LmxhdCgpXHJcbiAgc3dfbG5nPXN3LmxuZygpXHJcbiAgc3QgPSBHT1ZXSUtJLnN0YXRlX2ZpbHRlclxyXG4gIHR5ID0gR09WV0lLSS5nb3ZfdHlwZV9maWx0ZXJcclxuICBndGYgPSBHT1ZXSUtJLmdvdl90eXBlX2ZpbHRlcl8yXHJcblxyXG4gICMjI1xyXG4gICMgQnVpbGQgdGhlIHF1ZXJ5LlxyXG4gIHE9XCJcIlwiIFwibGF0aXR1ZGVcIjp7XCIkbHRcIjoje25lX2xhdH0sXCIkZ3RcIjoje3N3X2xhdH19LFwibG9uZ2l0dWRlXCI6e1wiJGx0XCI6I3tuZV9sbmd9LFwiJGd0XCI6I3tzd19sbmd9fVwiXCJcIlxyXG4gICMgQWRkIGZpbHRlcnMgaWYgdGhleSBleGlzdFxyXG4gIHErPVwiXCJcIixcInN0YXRlXCI6XCIje3N0fVwiIFwiXCJcIiBpZiBzdFxyXG4gIHErPVwiXCJcIixcImdvdl90eXBlXCI6XCIje3R5fVwiIFwiXCJcIiBpZiB0eVxyXG5cclxuXHJcbiAgZ2V0X3JlY29yZHMgcSwgMjAwLCAgKGRhdGEpIC0+XHJcbiAgICAjY29uc29sZS5sb2cgXCJsZW5ndGg9I3tkYXRhLmxlbmd0aH1cIlxyXG4gICAgI2NvbnNvbGUubG9nIFwibGF0OiAje25lX2xhdH0sI3tzd19sYXR9IGxuZzogI3tuZV9sbmd9LCAje3N3X2xuZ31cIlxyXG4gICAgbWFwLnJlbW92ZU1hcmtlcnMoKVxyXG4gICAgYWRkX21hcmtlcihyZWMpIGZvciByZWMgaW4gZGF0YVxyXG4gICAgcmV0dXJuXHJcbiAgIyMjXHJcblxyXG4gICMgQnVpbGQgdGhlIHF1ZXJ5IDIuXHJcbiAgcTI9XCJcIlwiIGxhdGl0dWRlPCN7bmVfbGF0fSBBTkQgbGF0aXR1ZGU+I3tzd19sYXR9IEFORCBsb25naXR1ZGU8I3tuZV9sbmd9IEFORCBsb25naXR1ZGU+I3tzd19sbmd9IEFORCBhbHRfdHlwZSE9XCJDb3VudHlcIiBcIlwiXCJcclxuICAjIEFkZCBmaWx0ZXJzIGlmIHRoZXkgZXhpc3RcclxuICBxMis9XCJcIlwiIEFORCBzdGF0ZT1cIiN7c3R9XCIgXCJcIlwiIGlmIHN0XHJcbiAgcTIrPVwiXCJcIiBBTkQgZ292X3R5cGU9XCIje3R5fVwiIFwiXCJcIiBpZiB0eVxyXG5cclxuICBpZiBndGYubGVuZ3RoID4gMFxyXG4gICAgZmlyc3QgPSB0cnVlXHJcbiAgICBhZGRpdGlvbmFsX2ZpbHRlciA9IFwiXCJcIiBBTkQgKFwiXCJcIlxyXG4gICAgZm9yIGdvdl90eXBlIGluIGd0ZlxyXG4gICAgICBpZiBub3QgZmlyc3RcclxuICAgICAgICBhZGRpdGlvbmFsX2ZpbHRlciArPSBcIlwiXCIgT1JcIlwiXCJcclxuICAgICAgYWRkaXRpb25hbF9maWx0ZXIgKz0gXCJcIlwiIGFsdF90eXBlPVwiI3tnb3ZfdHlwZX1cIiBcIlwiXCJcclxuICAgICAgZmlyc3QgPSBmYWxzZVxyXG4gICAgYWRkaXRpb25hbF9maWx0ZXIgKz0gXCJcIlwiKVwiXCJcIlxyXG5cclxuICAgIHEyICs9IGFkZGl0aW9uYWxfZmlsdGVyXHJcbiAgZWxzZVxyXG4gICAgcTIgKz0gXCJcIlwiIEFORCBhbHRfdHlwZSE9XCJDaXR5XCIgQU5EIGFsdF90eXBlIT1cIlNjaG9vbCBEaXN0cmljdFwiIEFORCBhbHRfdHlwZSE9XCJTcGVjaWFsIERpc3RyaWN0XCIgXCJcIlwiXHJcblxyXG4gIGdldF9yZWNvcmRzMiBxMiwgMjAwLCAgKGRhdGEpIC0+XHJcbiAgICAjY29uc29sZS5sb2cgXCJsZW5ndGg9I3tkYXRhLmxlbmd0aH1cIlxyXG4gICAgI2NvbnNvbGUubG9nIFwibGF0OiAje25lX2xhdH0sI3tzd19sYXR9IGxuZzogI3tuZV9sbmd9LCAje3N3X2xuZ31cIlxyXG4gICAgbWFwLnJlbW92ZU1hcmtlcnMoKVxyXG4gICAgYWRkX21hcmtlcihyZWMpIGZvciByZWMgaW4gZGF0YS5yZWNvcmRcclxuICAgIHJldHVyblxyXG5cclxuZ2V0X2ljb24gPShnb3ZfdHlwZSkgLT5cclxuXHJcbiAgX2NpcmNsZSA9KGNvbG9yKS0+XHJcbiAgICBwYXRoOiBnb29nbGUubWFwcy5TeW1ib2xQYXRoLkNJUkNMRVxyXG4gICAgZmlsbE9wYWNpdHk6IDFcclxuICAgIGZpbGxDb2xvcjpjb2xvclxyXG4gICAgc3Ryb2tlV2VpZ2h0OiAxXHJcbiAgICBzdHJva2VDb2xvcjond2hpdGUnXHJcbiAgICAjc3Ryb2tlUG9zaXRpb246IGdvb2dsZS5tYXBzLlN0cm9rZVBvc2l0aW9uLk9VVFNJREVcclxuICAgIHNjYWxlOjZcclxuXHJcbiAgc3dpdGNoIGdvdl90eXBlXHJcbiAgICB3aGVuICdHZW5lcmFsIFB1cnBvc2UnIHRoZW4gcmV0dXJuIF9jaXJjbGUgJ3JlZCdcclxuICAgIHdoZW4gJ1NjaG9vbCBEaXN0cmljdCcgdGhlbiByZXR1cm4gX2NpcmNsZSAnbGlnaHRibHVlJ1xyXG4gICAgd2hlbiAnRGVwZW5kZW50IFNjaG9vbCBTeXN0ZW0nIHRoZW4gcmV0dXJuIF9jaXJjbGUgJ2xpZ2h0Ymx1ZSdcclxuIyAgICB3aGVuICdDZW1ldGVyaWVzJyAgICAgIHRoZW4gcmV0dXJuIF9jaXJjbGUgJ3B1cnBsZSdcclxuIyAgICB3aGVuICdIb3NwaXRhbHMnICAgICAgIHRoZW4gcmV0dXJuIF9jaXJjbGUgJ2JsdWUnXHJcbiAgICBlbHNlIHJldHVybiBfY2lyY2xlICdwdXJwbGUnXHJcblxyXG5cclxuXHJcblxyXG5hZGRfbWFya2VyID0ocmVjKS0+XHJcbiAgI2NvbnNvbGUubG9nIFwiI3tyZWMucmFuZH0gI3tyZWMuaW5jX2lkfSAje3JlYy56aXB9ICN7cmVjLmxhdGl0dWRlfSAje3JlYy5sb25naXR1ZGV9ICN7cmVjLmdvdl9uYW1lfVwiXHJcbiAgbWFwLmFkZE1hcmtlclxyXG4gICAgbGF0OiByZWMubGF0aXR1ZGVcclxuICAgIGxuZzogcmVjLmxvbmdpdHVkZVxyXG4gICAgaWNvbjogZ2V0X2ljb24ocmVjLmdvdl90eXBlKVxyXG4gICAgdGl0bGU6ICBcIiN7cmVjLmdvdl9uYW1lfSwgI3tyZWMuZ292X3R5cGV9ICgje3JlYy5sYXRpdHVkZX0sICN7cmVjLmxvbmdpdHVkZX0pXCJcclxuICAgIGluZm9XaW5kb3c6XHJcbiAgICAgIGNvbnRlbnQ6IGNyZWF0ZV9pbmZvX3dpbmRvdyByZWNcclxuICAgIGNsaWNrOiAoZSktPlxyXG4gICAgICAjd2luZG93LkdPVldJS0kuc2hvd19yZWNvcmQgcmVjXHJcbiAgICAgIHdpbmRvdy5HT1ZXSUtJLnNob3dfcmVjb3JkMiByZWNcclxuXHJcbiAgcmV0dXJuXHJcblxyXG5cclxuY3JlYXRlX2luZm9fd2luZG93ID0ocikgLT5cclxuICB3ID0gJCgnPGRpdj48L2Rpdj4nKVxyXG4gIC5hcHBlbmQgJChcIjxhIGhyZWY9JyMnPjxzdHJvbmc+I3tyLmdvdl9uYW1lfTwvc3Ryb25nPjwvYT5cIikuY2xpY2sgKGUpLT5cclxuICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgY29uc29sZS5sb2cgclxyXG4gICAgI3dpbmRvdy5HT1ZXSUtJLnNob3dfcmVjb3JkIHJcclxuICAgIHdpbmRvdy5HT1ZXSUtJLnNob3dfcmVjb3JkMiByXHJcblxyXG4gIC5hcHBlbmQgJChcIjxkaXY+ICN7ci5nb3ZfdHlwZX0gICN7ci5jaXR5fSAje3IuemlwfSAje3Iuc3RhdGV9PC9kaXY+XCIpXHJcbiAgcmV0dXJuIHdbMF1cclxuXHJcblxyXG5cclxuXHJcbmdldF9yZWNvcmRzID0gKHF1ZXJ5LCBsaW1pdCwgb25zdWNjZXNzKSAtPlxyXG4gICQuYWpheFxyXG4gICAgdXJsOiBcImh0dHBzOi8vYXBpLm1vbmdvbGFiLmNvbS9hcGkvMS9kYXRhYmFzZXMvZ292d2lraS9jb2xsZWN0aW9ucy9nb3ZzLz9xPXsje3F1ZXJ5fX0mZj17X2lkOjB9Jmw9I3tsaW1pdH0mcz17cmFuZDoxfSZhcGlLZXk9MFk1WF9RazJ1T0pSZEhKV0pLU1JXazZsNkpxVlRTMnlcIlxyXG4gICAgZGF0YVR5cGU6ICdqc29uJ1xyXG4gICAgY2FjaGU6IHRydWVcclxuICAgIHN1Y2Nlc3M6IG9uc3VjY2Vzc1xyXG4gICAgZXJyb3I6KGUpIC0+XHJcbiAgICAgIGNvbnNvbGUubG9nIGVcclxuXHJcblxyXG5nZXRfcmVjb3JkczIgPSAocXVlcnksIGxpbWl0LCBvbnN1Y2Nlc3MpIC0+XHJcbiAgJC5hamF4XHJcbiAgICB1cmw6XCJodHRwOi8vNDYuMTAxLjMuNzk6ODAvcmVzdC9kYi9nb3ZzXCJcclxuICAgIGRhdGE6XHJcbiAgICAgICNmaWx0ZXI6XCJsYXRpdHVkZT4zMiBBTkQgbGF0aXR1ZGU8MzQgQU5EIGxvbmdpdHVkZT4tODcgQU5EIGxvbmdpdHVkZTwtODZcIlxyXG4gICAgICBmaWx0ZXI6cXVlcnlcclxuICAgICAgZmllbGRzOlwiX2lkLGluY19pZCxnb3ZfbmFtZSxnb3ZfdHlwZSxjaXR5LHppcCxzdGF0ZSxsYXRpdHVkZSxsb25naXR1ZGUsYWx0X25hbWVcIlxyXG4gICAgICBhcHBfbmFtZTpcImdvdndpa2lcIlxyXG4gICAgICBvcmRlcjpcInJhbmRcIlxyXG4gICAgICBsaW1pdDpsaW1pdFxyXG5cclxuICAgIGRhdGFUeXBlOiAnanNvbidcclxuICAgIGNhY2hlOiB0cnVlXHJcbiAgICBzdWNjZXNzOiBvbnN1Y2Nlc3NcclxuICAgIGVycm9yOihlKSAtPlxyXG4gICAgICBjb25zb2xlLmxvZyBlXHJcblxyXG4jIEdFT0NPRElORyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcblxyXG5waW5JbWFnZSA9IG5ldyAoZ29vZ2xlLm1hcHMuTWFya2VySW1hZ2UpKFxyXG4gICdodHRwOi8vY2hhcnQuYXBpcy5nb29nbGUuY29tL2NoYXJ0P2Noc3Q9ZF9tYXBfcGluX2xldHRlciZjaGxkPVp8Nzc3N0JCfEZGRkZGRicgLFxyXG4gIG5ldyAoZ29vZ2xlLm1hcHMuU2l6ZSkoMjEsIDM0KSxcclxuICBuZXcgKGdvb2dsZS5tYXBzLlBvaW50KSgwLCAwKSxcclxuICBuZXcgKGdvb2dsZS5tYXBzLlBvaW50KSgxMCwgMzQpXHJcbiAgKVxyXG5cclxuXHJcbmdlb2NvZGVfYWRkciA9IChhZGRyLGRhdGEpIC0+XHJcbiAgR01hcHMuZ2VvY29kZVxyXG4gICAgYWRkcmVzczogYWRkclxyXG4gICAgY2FsbGJhY2s6IChyZXN1bHRzLCBzdGF0dXMpIC0+XHJcbiAgICAgIGlmIHN0YXR1cyA9PSAnT0snXHJcbiAgICAgICAgbGF0bG5nID0gcmVzdWx0c1swXS5nZW9tZXRyeS5sb2NhdGlvblxyXG4gICAgICAgIG1hcC5zZXRDZW50ZXIgbGF0bG5nLmxhdCgpLCBsYXRsbmcubG5nKClcclxuICAgICAgICBtYXAuYWRkTWFya2VyXHJcbiAgICAgICAgICBsYXQ6IGxhdGxuZy5sYXQoKVxyXG4gICAgICAgICAgbG5nOiBsYXRsbmcubG5nKClcclxuICAgICAgICAgIHNpemU6ICdzbWFsbCdcclxuICAgICAgICAgIHRpdGxlOiByZXN1bHRzWzBdLmZvcm1hdHRlZF9hZGRyZXNzXHJcbiAgICAgICAgICBpbmZvV2luZG93OlxyXG4gICAgICAgICAgICBjb250ZW50OiByZXN1bHRzWzBdLmZvcm1hdHRlZF9hZGRyZXNzXHJcblxyXG4gICAgICAgIGlmIGRhdGFcclxuICAgICAgICAgIG1hcC5hZGRNYXJrZXJcclxuICAgICAgICAgICAgbGF0OiBkYXRhLmxhdGl0dWRlXHJcbiAgICAgICAgICAgIGxuZzogZGF0YS5sb25naXR1ZGVcclxuICAgICAgICAgICAgc2l6ZTogJ3NtYWxsJ1xyXG4gICAgICAgICAgICBjb2xvcjogJ2JsdWUnXHJcbiAgICAgICAgICAgIGljb246IHBpbkltYWdlXHJcbiAgICAgICAgICAgIHRpdGxlOiAgXCIje2RhdGEubGF0aXR1ZGV9ICN7ZGF0YS5sb25naXR1ZGV9XCJcclxuICAgICAgICAgICAgaW5mb1dpbmRvdzpcclxuICAgICAgICAgICAgICBjb250ZW50OiBcIiN7ZGF0YS5sYXRpdHVkZX0gI3tkYXRhLmxvbmdpdHVkZX1cIlxyXG5cclxuICAgICAgICAkKCcuZ292bWFwLWZvdW5kJykuaHRtbCBcIjxzdHJvbmc+Rk9VTkQ6IDwvc3Ryb25nPiN7cmVzdWx0c1swXS5mb3JtYXR0ZWRfYWRkcmVzc31cIlxyXG4gICAgICByZXR1cm5cclxuXHJcblxyXG5jbGVhcj0ocyktPlxyXG4gIHJldHVybiBpZiBzLm1hdGNoKC8gYm94IC9pKSB0aGVuICcnIGVsc2Ugc1xyXG5cclxuZ2VvY29kZSA9IChkYXRhKSAtPlxyXG4gIGFkZHIgPSBcIiN7Y2xlYXIoZGF0YS5hZGRyZXNzMSl9ICN7Y2xlYXIoZGF0YS5hZGRyZXNzMil9LCAje2RhdGEuY2l0eX0sICN7ZGF0YS5zdGF0ZX0gI3tkYXRhLnppcH0sIFVTQVwiXHJcbiAgJCgnI2dvdmFkZHJlc3MnKS52YWwoYWRkcilcclxuICBnZW9jb2RlX2FkZHIgYWRkciwgZGF0YVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID1cclxuICBnZW9jb2RlOiBnZW9jb2RlXHJcbiAgZ29jb2RlX2FkZHI6IGdlb2NvZGVfYWRkclxyXG4gIG9uX2JvdW5kc19jaGFuZ2VkOiBvbl9ib3VuZHNfY2hhbmdlZFxyXG4gIG9uX2JvdW5kc19jaGFuZ2VkX2xhdGVyOiBvbl9ib3VuZHNfY2hhbmdlZF9sYXRlclxyXG4gIG1hcDogbWFwXHJcbiIsIlxyXG5xdWVyeV9tYXRjaGVyID0gcmVxdWlyZSgnLi9xdWVyeW1hdGNoZXIuY29mZmVlJylcclxuXHJcbmNsYXNzIEdvdlNlbGVjdG9yXHJcbiAgXHJcbiAgIyBzdHViIG9mIGEgY2FsbGJhY2sgdG8gZW52b2tlIHdoZW4gdGhlIHVzZXIgc2VsZWN0cyBzb21ldGhpbmdcclxuICBvbl9zZWxlY3RlZDogKGV2dCwgZGF0YSwgbmFtZSkgLT5cclxuXHJcblxyXG4gIGNvbnN0cnVjdG9yOiAoQGh0bWxfc2VsZWN0b3IsIGRvY3NfdXJsLCBAbnVtX2l0ZW1zKSAtPlxyXG4gICAgJC5hamF4XHJcbiAgICAgIHVybDogZG9jc191cmxcclxuICAgICAgZGF0YVR5cGU6ICdqc29uJ1xyXG4gICAgICBjYWNoZTogdHJ1ZVxyXG4gICAgICBzdWNjZXNzOiBAc3RhcnRTdWdnZXN0aW9uXHJcbiAgICAgIFxyXG5cclxuXHJcblxyXG4gIHN1Z2dlc3Rpb25UZW1wbGF0ZSA6IEhhbmRsZWJhcnMuY29tcGlsZShcIlwiXCJcclxuICAgIDxkaXYgY2xhc3M9XCJzdWdnLWJveFwiPlxyXG4gICAgICA8ZGl2IGNsYXNzPVwic3VnZy1zdGF0ZVwiPnt7e3N0YXRlfX19PC9kaXY+XHJcbiAgICAgIDxkaXYgY2xhc3M9XCJzdWdnLW5hbWVcIj57e3tnb3ZfbmFtZX19fTwvZGl2PlxyXG4gICAgICA8ZGl2IGNsYXNzPVwic3VnZy10eXBlXCI+e3t7Z292X3R5cGV9fX08L2Rpdj5cclxuICAgIDwvZGl2PlwiXCJcIilcclxuXHJcblxyXG5cclxuICBlbnRlcmVkX3ZhbHVlID0gXCJcIlxyXG5cclxuICBnb3ZzX2FycmF5ID0gW11cclxuXHJcbiAgY291bnRfZ292cyA6ICgpIC0+XHJcbiAgICBjb3VudCA9MFxyXG4gICAgZm9yIGQgaW4gQGdvdnNfYXJyYXlcclxuICAgICAgaWYgR09WV0lLSS5zdGF0ZV9maWx0ZXIgYW5kIGQuc3RhdGUgaXNudCBHT1ZXSUtJLnN0YXRlX2ZpbHRlciB0aGVuIGNvbnRpbnVlXHJcbiAgICAgIGlmIEdPVldJS0kuZ292X3R5cGVfZmlsdGVyIGFuZCBkLmdvdl90eXBlIGlzbnQgR09WV0lLSS5nb3ZfdHlwZV9maWx0ZXIgdGhlbiBjb250aW51ZVxyXG4gICAgICBjb3VudCsrXHJcbiAgICByZXR1cm4gY291bnRcclxuXHJcblxyXG4gIHN0YXJ0U3VnZ2VzdGlvbiA6IChnb3ZzKSA9PlxyXG4gICAgI0Bnb3ZzX2FycmF5ID0gZ292c1xyXG4gICAgQGdvdnNfYXJyYXkgPSBnb3ZzLnJlY29yZFxyXG4gICAgJCgnLnR5cGVhaGVhZCcpLmtleXVwIChldmVudCkgPT5cclxuICAgICAgQGVudGVyZWRfdmFsdWUgPSAkKGV2ZW50LnRhcmdldCkudmFsKClcclxuICAgIFxyXG4gICAgJChAaHRtbF9zZWxlY3RvcikuYXR0ciAncGxhY2Vob2xkZXInLCAnR09WRVJOTUVOVCBOQU1FJ1xyXG4gICAgJChAaHRtbF9zZWxlY3RvcikudHlwZWFoZWFkKFxyXG4gICAgICAgIGhpbnQ6IGZhbHNlXHJcbiAgICAgICAgaGlnaGxpZ2h0OiBmYWxzZVxyXG4gICAgICAgIG1pbkxlbmd0aDogMVxyXG4gICAgICAgIGNsYXNzTmFtZXM6XHJcbiAgICAgICAgXHRtZW51OiAndHQtZHJvcGRvd24tbWVudSdcclxuICAgICAgLFxyXG4gICAgICAgIG5hbWU6ICdnb3ZfbmFtZSdcclxuICAgICAgICBkaXNwbGF5S2V5OiAnZ292X25hbWUnXHJcbiAgICAgICAgc291cmNlOiBxdWVyeV9tYXRjaGVyKEBnb3ZzX2FycmF5LCBAbnVtX2l0ZW1zKVxyXG4gICAgICAgICNzb3VyY2U6IGJsb29kaG91bmQudHRBZGFwdGVyKClcclxuICAgICAgICB0ZW1wbGF0ZXM6IHN1Z2dlc3Rpb246IEBzdWdnZXN0aW9uVGVtcGxhdGVcclxuICAgIClcclxuICAgIC5vbiAndHlwZWFoZWFkOnNlbGVjdGVkJywgIChldnQsIGRhdGEsIG5hbWUpID0+XHJcbiAgICAgICAgJCgnLnR5cGVhaGVhZCcpLnR5cGVhaGVhZCAndmFsJywgQGVudGVyZWRfdmFsdWVcclxuICAgICAgICBAb25fc2VsZWN0ZWQoZXZ0LCBkYXRhLCBuYW1lKVxyXG4gICBcclxuICAgIC5vbiAndHlwZWFoZWFkOmN1cnNvcmNoYW5nZWQnLCAoZXZ0LCBkYXRhLCBuYW1lKSA9PlxyXG4gICAgICAgICQoJy50eXBlYWhlYWQnKS52YWwgQGVudGVyZWRfdmFsdWVcclxuICAgIFxyXG5cclxuICAgIyAkKCcuZ292LWNvdW50ZXInKS50ZXh0IEBjb3VudF9nb3ZzKClcclxuICAgIHJldHVyblxyXG5cclxuXHJcblxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzPUdvdlNlbGVjdG9yXHJcblxyXG5cclxuXHJcbiIsIiMjI1xyXG5maWxlOiBtYWluLmNvZmZlIC0tIFRoZSBlbnRyeSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gIDpcclxuZ292X2ZpbmRlciA9IG5ldyBHb3ZGaW5kZXJcclxuZ292X2RldGFpbHMgPSBuZXcgR292RGV0YWlsc1xyXG5nb3ZfZmluZGVyLm9uX3NlbGVjdCA9IGdvdl9kZXRhaWxzLnNob3dcclxuLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuIyMjXHJcblxyXG5Hb3ZTZWxlY3RvciA9IHJlcXVpcmUgJy4vZ292c2VsZWN0b3IuY29mZmVlJ1xyXG4jX2pxZ3MgICAgICAgPSByZXF1aXJlICcuL2pxdWVyeS5nb3ZzZWxlY3Rvci5jb2ZmZWUnXHJcblRlbXBsYXRlczIgICAgICA9IHJlcXVpcmUgJy4vdGVtcGxhdGVzMi5jb2ZmZWUnXHJcbmdvdm1hcCAgICAgID0gcmVxdWlyZSAnLi9nb3ZtYXAuY29mZmVlJ1xyXG4jc2Nyb2xsdG8gPSByZXF1aXJlICcuLi9ib3dlcl9jb21wb25lbnRzL2pxdWVyeS5zY3JvbGxUby9qcXVlcnkuc2Nyb2xsVG8uanMnXHJcblxyXG53aW5kb3cuR09WV0lLSSA9XHJcbiAgc3RhdGVfZmlsdGVyIDogJydcclxuICBnb3ZfdHlwZV9maWx0ZXIgOiAnJ1xyXG4gIGdvdl90eXBlX2ZpbHRlcl8yIDogWydDaXR5JywgJ1NjaG9vbCBEaXN0cmljdCcsICdTcGVjaWFsIERpc3RyaWN0J11cclxuXHJcbiAgc2hvd19zZWFyY2hfcGFnZTogKCkgLT5cclxuICAgICQod2luZG93KS5zY3JvbGxUbygnMHB4JywxMClcclxuICAgICQoJyNkYXRhQ29udGFpbmVyJykuaGlkZSgpXHJcbiAgICAkKCcjc2VhcmNoSWNvbicpLmhpZGUoKVxyXG4gICAgJCgnI3NlYXJjaENvbnRhaW5lcicpLmZhZGVJbigzMDApXHJcbiAgICBmb2N1c19zZWFyY2hfZmllbGQgNTAwXHJcblxyXG4gIHNob3dfZGF0YV9wYWdlOiAoKSAtPlxyXG4gICAgJCh3aW5kb3cpLnNjcm9sbFRvKCcwcHgnLDEwKVxyXG4gICAgJCgnI3NlYXJjaEljb24nKS5zaG93KClcclxuICAgICQoJyNkYXRhQ29udGFpbmVyJykuZmFkZUluKDMwMClcclxuICAgICQoJyNzZWFyY2hDb250YWluZXInKS5oaWRlKClcclxuICAgICMkKHdpbmRvdykuc2Nyb2xsVG8oJyNwQmFja1RvU2VhcmNoJyw2MDApXHJcblxyXG4jZ292X3NlbGVjdG9yID0gbmV3IEdvdlNlbGVjdG9yICcudHlwZWFoZWFkJywgJ2RhdGEvaF90eXBlcy5qc29uJywgN1xyXG5nb3Zfc2VsZWN0b3IgPSBuZXcgR292U2VsZWN0b3IgJy50eXBlYWhlYWQnLCAnZGF0YS9oX3R5cGVzX2NhLmpzb24nLCA3XHJcbiNnb3Zfc2VsZWN0b3IgPSBuZXcgR292U2VsZWN0b3IgJy50eXBlYWhlYWQnLCAnaHR0cDovLzQ2LjEwMS4zLjc5L3Jlc3QvZGIvZ292cz9maWx0ZXI9c3RhdGU9JTIyQ0ElMjImYXBwX25hbWU9Z292d2lraSZmaWVsZHM9X2lkLGdvdl9uYW1lLGdvdl90eXBlLHN0YXRlJmxpbWl0PTUwMDAnLCA3XHJcbnRlbXBsYXRlcyA9IG5ldyBUZW1wbGF0ZXMyXHJcbmFjdGl2ZV90YWI9XCJcIlxyXG5cclxuIyBMb2FkIGludHJvZHVjdG9yeSB0ZXh0IGZyb20gdGV4dHMvaW50cm8tdGV4dC5odG1sIHRvICNpbnRyby10ZXh0IGNvbnRhaW5lci5cclxuJC5nZXQgXCJ0ZXh0cy9pbnRyby10ZXh0Lmh0bWxcIiwgKGRhdGEpIC0+XHJcbiAgJChcIiNpbnRyby10ZXh0XCIpLmh0bWwgZGF0YVxyXG5cclxuIyBmaXJlIGNsaWVudC1zaWRlIFVSTCByb3V0aW5nXHJcbnJvdXRlciA9IG5ldyBHcmFwbmVsXHJcbnJvdXRlci5nZXQgJzppZCcsIChyZXEpIC0+XHJcbiAgaWQgPSByZXEucGFyYW1zLmlkXHJcbiAgY29uc29sZS5sb2cgXCJST1VURVIgSUQ9I3tpZH1cIlxyXG4gIGdldF9lbGVjdGVkX29mZmljaWFscyA9IChnb3ZfaWQsIGxpbWl0LCBvbnN1Y2Nlc3MpIC0+XHJcbiAgICAkLmFqYXhcclxuICAgICAgdXJsOlwiaHR0cDovLzQ2LjEwMS4zLjc5OjgwL3Jlc3QvZGIvZWxlY3RlZF9vZmZpY2lhbHNcIlxyXG4gICAgICBkYXRhOlxyXG4gICAgICAgIGZpbHRlcjpcImdvdnNfaWQ9XCIgKyBnb3ZfaWRcclxuICAgICAgICBmaWVsZHM6XCJnb3ZzX2lkLHRpdGxlLGZ1bGxfbmFtZSxlbWFpbF9hZGRyZXNzLHBob3RvX3VybCx0ZXJtX2V4cGlyZXNcIlxyXG4gICAgICAgIGFwcF9uYW1lOlwiZ292d2lraVwiXHJcbiAgICAgICAgb3JkZXI6XCJkaXNwbGF5X29yZGVyXCJcclxuICAgICAgICBsaW1pdDpsaW1pdFxyXG5cclxuICAgICAgZGF0YVR5cGU6ICdqc29uJ1xyXG4gICAgICBjYWNoZTogdHJ1ZVxyXG4gICAgICBzdWNjZXNzOiBvbnN1Y2Nlc3NcclxuICAgICAgZXJyb3I6KGUpIC0+XHJcbiAgICAgICAgY29uc29sZS5sb2cgZVxyXG4gIGlmIGlzTmFOKGlkKVxyXG4gICAgaWQgPSBpZC5yZXBsYWNlKC9fL2csJyAnKVxyXG4gICAgYnVpbGRfZGF0YSA9IChpZCwgbGltaXQsIG9uc3VjY2VzcykgLT5cclxuICAgICAgJC5hamF4XHJcbiAgICAgICAgdXJsOlwiaHR0cDovLzQ2LjEwMS4zLjc5OjgwL3Jlc3QvZGIvZ292c1wiXHJcbiAgICAgICAgZGF0YTpcclxuICAgICAgICAgIGZpbHRlcjpcImFsdF9uYW1lPScje2lkfSdcIlxyXG4gICAgICAgICAgYXBwX25hbWU6XCJnb3Z3aWtpXCJcclxuICAgICAgICBkYXRhVHlwZTogJ2pzb24nXHJcbiAgICAgICAgY2FjaGU6IHRydWVcclxuICAgICAgICBzdWNjZXNzOiAoZGF0YSkgLT5cclxuICAgICAgICAgIGVsZWN0ZWRfb2ZmaWNpYWxzID0gZ2V0X2VsZWN0ZWRfb2ZmaWNpYWxzIGRhdGEucmVjb3JkWzBdLl9pZCwgMjUsIChlbGVjdGVkX29mZmljaWFsc19kYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikgLT5cclxuICAgICAgICAgICAgZ292X2lkID0gZGF0YS5yZWNvcmRbMF0uX2lkXHJcbiAgICAgICAgICAgIGRhdGEgPSBuZXcgT2JqZWN0KClcclxuICAgICAgICAgICAgZGF0YS5faWQgPSBnb3ZfaWRcclxuICAgICAgICAgICAgZGF0YS5lbGVjdGVkX29mZmljaWFscyA9IGVsZWN0ZWRfb2ZmaWNpYWxzX2RhdGFcclxuICAgICAgICAgICAgZGF0YS5nb3ZfbmFtZSA9IFwiXCJcclxuICAgICAgICAgICAgZGF0YS5nb3ZfdHlwZSA9IFwiXCJcclxuICAgICAgICAgICAgZGF0YS5zdGF0ZSA9IFwiXCJcclxuICAgICAgICAgICAgJCgnI2RldGFpbHMnKS5odG1sIHRlbXBsYXRlcy5nZXRfaHRtbCgwLCBkYXRhKVxyXG4gICAgICAgICAgICBnZXRfcmVjb3JkMiBkYXRhLl9pZFxyXG4gICAgICAgICAgICBhY3RpdmF0ZV90YWIoKVxyXG4gICAgICAgICAgICBHT1ZXSUtJLnNob3dfZGF0YV9wYWdlKClcclxuICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgZXJyb3I6KGUpIC0+XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyBlXHJcbiAgICBidWlsZF9kYXRhKGlkKVxyXG4gIGVsc2VcclxuICAgIGVsZWN0ZWRfb2ZmaWNpYWxzID0gZ2V0X2VsZWN0ZWRfb2ZmaWNpYWxzIGlkLCAyNSwgKGVsZWN0ZWRfb2ZmaWNpYWxzX2RhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSAtPlxyXG4gICAgICBkYXRhID0gbmV3IE9iamVjdCgpXHJcbiAgICAgIGRhdGEuX2lkID0gaWRcclxuICAgICAgZGF0YS5lbGVjdGVkX29mZmljaWFscyA9IGVsZWN0ZWRfb2ZmaWNpYWxzX2RhdGFcclxuICAgICAgZGF0YS5nb3ZfbmFtZSA9IFwiXCJcclxuICAgICAgZGF0YS5nb3ZfdHlwZSA9IFwiXCJcclxuICAgICAgZGF0YS5zdGF0ZSA9IFwiXCJcclxuICAgICAgJCgnI2RldGFpbHMnKS5odG1sIHRlbXBsYXRlcy5nZXRfaHRtbCgwLCBkYXRhKVxyXG4gICAgICBnZXRfcmVjb3JkMiBkYXRhLl9pZFxyXG4gICAgICBhY3RpdmF0ZV90YWIoKVxyXG4gICAgICBHT1ZXSUtJLnNob3dfZGF0YV9wYWdlKClcclxuICAgICAgcmV0dXJuXHJcblxyXG5cclxuR09WV0lLSS5nZXRfY291bnRpZXMgPSBnZXRfY291bnRpZXMgPSAoY2FsbGJhY2spIC0+XHJcbiAgJC5hamF4XHJcbiAgICB1cmw6ICdkYXRhL2NvdW50eV9nZW9ncmFwaHlfY2EuanNvbidcclxuICAgIGRhdGFUeXBlOiAnanNvbidcclxuICAgIGNhY2hlOiB0cnVlXHJcbiAgICBzdWNjZXNzOiAoY291bnRpZXNKU09OKSAtPlxyXG4gICAgICBjYWxsYmFjayBjb3VudGllc0pTT05cclxuXHJcbkdPVldJS0kuZHJhd19wb2x5Z29ucyA9IGRyYXdfcG9seWdvbnMgPSAoY291bnRpZXNKU09OKSAtPlxyXG4gIGZvciBjb3VudHkgaW4gY291bnRpZXNKU09OLmZlYXR1cmVzXHJcbiAgICBnb3ZtYXAubWFwLmRyYXdQb2x5Z29uKHtcclxuICAgICAgcGF0aHM6IGNvdW50eS5nZW9tZXRyeS5jb29yZGluYXRlc1xyXG4gICAgICB1c2VHZW9KU09OOiB0cnVlXHJcbiAgICAgIHN0cm9rZUNvbG9yOiAnI0ZGMDAwMCdcclxuICAgICAgc3Ryb2tlT3BhY2l0eTogMC42XHJcbiAgICAgIHN0cm9rZVdlaWdodDogMS41XHJcbiAgICAgIGZpbGxDb2xvcjogJyNGRjAwMDAnXHJcbiAgICAgIGZpbGxPcGFjaXR5OiAwLjE1XHJcbiAgICAgIGNvdW50eUlkOiBjb3VudHkucHJvcGVydGllcy5faWRcclxuICAgICAgYWx0TmFtZTogY291bnR5LnByb3BlcnRpZXMuYWx0X25hbWVcclxuICAgICAgbWFya2VyOiBuZXcgTWFya2VyV2l0aExhYmVsKHtcclxuICAgICAgICBwb3NpdGlvbjogbmV3IGdvb2dsZS5tYXBzLkxhdExuZygwLDApLFxyXG4gICAgICAgIGRyYWdnYWJsZTogZmFsc2UsXHJcbiAgICAgICAgcmFpc2VPbkRyYWc6IGZhbHNlLFxyXG4gICAgICAgIG1hcDogZ292bWFwLm1hcC5tYXAsXHJcbiAgICAgICAgbGFiZWxDb250ZW50OiBjb3VudHkucHJvcGVydGllcy5uYW1lLFxyXG4gICAgICAgIGxhYmVsQW5jaG9yOiBuZXcgZ29vZ2xlLm1hcHMuUG9pbnQoLTE1LCAyNSksXHJcbiAgICAgICAgbGFiZWxDbGFzczogXCJsYWJlbC10b29sdGlwXCIsXHJcbiAgICAgICAgbGFiZWxTdHlsZToge29wYWNpdHk6IDEuMH0sXHJcbiAgICAgICAgaWNvbjogXCJodHRwOi8vcGxhY2Vob2xkLml0LzF4MVwiLFxyXG4gICAgICAgIHZpc2libGU6IGZhbHNlXHJcbiAgICAgIH0pXHJcbiAgICAgIG1vdXNlb3ZlcjogLT5cclxuICAgICAgICB0aGlzLnNldE9wdGlvbnMoe2ZpbGxDb2xvcjogXCIjMDBGRjAwXCJ9KVxyXG4gICAgICBtb3VzZW1vdmU6IChldmVudCkgLT5cclxuICAgICAgICB0aGlzLm1hcmtlci5zZXRQb3NpdGlvbihldmVudC5sYXRMbmcpXHJcbiAgICAgICAgdGhpcy5tYXJrZXIuc2V0VmlzaWJsZSh0cnVlKVxyXG4gICAgICBtb3VzZW91dDogLT5cclxuICAgICAgICB0aGlzLnNldE9wdGlvbnMoe2ZpbGxDb2xvcjogXCIjRkYwMDAwXCJ9KVxyXG4gICAgICAgIHRoaXMubWFya2VyLnNldFZpc2libGUoZmFsc2UpXHJcbiAgICAgIGNsaWNrOiAtPlxyXG4gICAgICAgIHJvdXRlci5uYXZpZ2F0ZSBcIiN7dGhpcy5jb3VudHlJZH1cIlxyXG4gICAgfSlcclxuXHJcbmdldF9jb3VudGllcyBkcmF3X3BvbHlnb25zXHJcblxyXG53aW5kb3cucmVtZW1iZXJfdGFiID0obmFtZSktPiBhY3RpdmVfdGFiID0gbmFtZVxyXG5cclxuI3dpbmRvdy5nZW9jb2RlX2FkZHIgPSAoaW5wdXRfc2VsZWN0b3IpLT4gZ292bWFwLmdvY29kZV9hZGRyICQoaW5wdXRfc2VsZWN0b3IpLnZhbCgpXHJcblxyXG4kKGRvY3VtZW50KS5vbiAnY2xpY2snLCAnI2ZpZWxkVGFicyBhJywgKGUpIC0+XHJcbiAgYWN0aXZlX3RhYiA9ICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCd0YWJuYW1lJylcclxuICBjb25zb2xlLmxvZyBhY3RpdmVfdGFiXHJcbiAgJChcIiN0YWJzQ29udGVudCAudGFiLXBhbmVcIikucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIilcclxuICAkKCQoZS5jdXJyZW50VGFyZ2V0KS5hdHRyKCdocmVmJykpLmFkZENsYXNzKFwiYWN0aXZlXCIpXHJcbiAgdGVtcGxhdGVzLmFjdGl2YXRlIDAsIGFjdGl2ZV90YWJcclxuXHJcbiAgaWYgYWN0aXZlX3RhYiA9PSAnRmluYW5jaWFsIFN0YXRlbWVudHMnXHJcbiAgICBmaW5WYWxXaWR0aE1heDEgPSAwXHJcbiAgICBmaW5WYWxXaWR0aE1heDIgPSAwXHJcbiAgICBmaW5WYWxXaWR0aE1heDMgPSAwXHJcblxyXG4gICAgJCgnLmZpbi12YWx1ZXMtYmxvY2sgW2RhdGEtY29sPVwiMVwiXScpLmZpbmQoJy5maW4tdmFsJykuZWFjaCAoKSAtPlxyXG4gICAgICAgIHRoaXNGaW5WYWxXaWR0aCA9ICQodGhpcykud2lkdGgoKVxyXG5cclxuICAgICAgICBpZiB0aGlzRmluVmFsV2lkdGggPiBmaW5WYWxXaWR0aE1heDFcclxuICAgICAgICAgICAgZmluVmFsV2lkdGhNYXgxID0gdGhpc0ZpblZhbFdpZHRoXHJcblxyXG4gICAgJCgnLmZpbi12YWx1ZXMtYmxvY2sgW2RhdGEtY29sPVwiMlwiXScpLmZpbmQoJy5maW4tdmFsJykuZWFjaCAoKSAtPlxyXG4gICAgICAgIHRoaXNGaW5WYWxXaWR0aCA9ICQodGhpcykud2lkdGgoKVxyXG5cclxuICAgICAgICBpZiB0aGlzRmluVmFsV2lkdGggPiBmaW5WYWxXaWR0aE1heDJcclxuICAgICAgICAgICAgZmluVmFsV2lkdGhNYXgyID0gdGhpc0ZpblZhbFdpZHRoXHJcblxyXG4gICAgJCgnLmZpbi12YWx1ZXMtYmxvY2sgW2RhdGEtY29sPVwiM1wiXScpLmZpbmQoJy5maW4tdmFsJykuZWFjaCAoKSAtPlxyXG4gICAgICAgIHRoaXNGaW5WYWxXaWR0aCA9ICQodGhpcykud2lkdGgoKVxyXG5cclxuICAgICAgICBpZiB0aGlzRmluVmFsV2lkdGggPiBmaW5WYWxXaWR0aE1heDNcclxuICAgICAgICAgICAgZmluVmFsV2lkdGhNYXgzID0gdGhpc0ZpblZhbFdpZHRoXHJcblxyXG4gICAgJCgnLmZpbi12YWx1ZXMtYmxvY2sgW2RhdGEtY29sPVwiMVwiXSAuY3VycmVuY3ktc2lnbicpLmNzcygncmlnaHQnLCBmaW5WYWxXaWR0aE1heDEgKyAyNylcclxuICAgICQoJy5maW4tdmFsdWVzLWJsb2NrIFtkYXRhLWNvbD1cIjJcIl0gLmN1cnJlbmN5LXNpZ24nKS5jc3MoJ3JpZ2h0JywgZmluVmFsV2lkdGhNYXgyICsgMjcpXHJcbiAgICAkKCcuZmluLXZhbHVlcy1ibG9jayBbZGF0YS1jb2w9XCIzXCJdIC5jdXJyZW5jeS1zaWduJykuY3NzKCdyaWdodCcsIGZpblZhbFdpZHRoTWF4MyArIDI3KVxyXG5cclxuXHJcbiQoZG9jdW1lbnQpLnRvb2x0aXAoe3NlbGVjdG9yOiBcIltjbGFzcz0nbWVkaWEtdG9vbHRpcCddXCIsdHJpZ2dlcjonY2xpY2snfSlcclxuXHJcbmFjdGl2YXRlX3RhYiA9KCkgLT5cclxuICAkKFwiI2ZpZWxkVGFicyBhW2hyZWY9JyN0YWIje2FjdGl2ZV90YWJ9J11cIikudGFiKCdzaG93JylcclxuXHJcbmdvdl9zZWxlY3Rvci5vbl9zZWxlY3RlZCA9IChldnQsIGRhdGEsIG5hbWUpIC0+XHJcbiAgI3JlbmRlckRhdGEgJyNkZXRhaWxzJywgZGF0YVxyXG4gIGdldF9lbGVjdGVkX29mZmljaWFscyBkYXRhLl9pZCwgMjUsIChkYXRhMiwgdGV4dFN0YXR1cywganFYSFIpIC0+XHJcbiAgICBkYXRhLmVsZWN0ZWRfb2ZmaWNpYWxzID0gZGF0YTJcclxuICAgICQoJyNkZXRhaWxzJykuaHRtbCB0ZW1wbGF0ZXMuZ2V0X2h0bWwoMCwgZGF0YSlcclxuICAgICNnZXRfcmVjb3JkIFwiaW5jX2lkOiN7ZGF0YVtcImluY19pZFwiXX1cIlxyXG4gICAgZ2V0X3JlY29yZDIgZGF0YVtcIl9pZFwiXVxyXG4gICAgYWN0aXZhdGVfdGFiKClcclxuICAgIEdPVldJS0kuc2hvd19kYXRhX3BhZ2UoKVxyXG4gICAgcm91dGVyLm5hdmlnYXRlIFwiI3tkYXRhLl9pZH1cIlxyXG4gICAgcmV0dXJuXHJcblxyXG5cclxuZ2V0X3JlY29yZCA9IChxdWVyeSkgLT5cclxuICAkLmFqYXhcclxuICAgIHVybDogXCJodHRwczovL2FwaS5tb25nb2xhYi5jb20vYXBpLzEvZGF0YWJhc2VzL2dvdndpa2kvY29sbGVjdGlvbnMvZ292cy8/cT17I3txdWVyeX19JmY9e19pZDowfSZsPTEmYXBpS2V5PTBZNVhfUWsydU9KUmRISldKS1NSV2s2bDZKcVZUUzJ5XCJcclxuICAgIGRhdGFUeXBlOiAnanNvbidcclxuICAgIGNhY2hlOiB0cnVlXHJcbiAgICBzdWNjZXNzOiAoZGF0YSkgLT5cclxuICAgICAgaWYgZGF0YS5sZW5ndGhcclxuICAgICAgICAkKCcjZGV0YWlscycpLmh0bWwgdGVtcGxhdGVzLmdldF9odG1sKDAsIGRhdGFbMF0pXHJcbiAgICAgICAgYWN0aXZhdGVfdGFiKClcclxuICAgICAgICAjZ292bWFwLmdlb2NvZGUgZGF0YVswXVxyXG4gICAgICByZXR1cm5cclxuICAgIGVycm9yOihlKSAtPlxyXG4gICAgICBjb25zb2xlLmxvZyBlXHJcblxyXG5cclxuZ2V0X3JlY29yZDIgPSAocmVjaWQpIC0+XHJcbiAgJC5hamF4XHJcbiAgICAjdXJsOiBcImh0dHBzOi8vZHNwLWdvdndpa2kuY2xvdWQuZHJlYW1mYWN0b3J5LmNvbTo0NDMvcmVzdC9nb3Z3aWtpX2FwaS9nb3ZzLyN7cmVjaWR9XCJcclxuICAgIHVybDogXCJodHRwOi8vNDYuMTAxLjMuNzk6ODAvcmVzdC9kYi9nb3ZzLyN7cmVjaWR9XCJcclxuICAgIGRhdGFUeXBlOiAnanNvbidcclxuICAgIGhlYWRlcnM6IHtcIlgtRHJlYW1GYWN0b3J5LUFwcGxpY2F0aW9uLU5hbWVcIjpcImdvdndpa2lcIn1cclxuICAgIGNhY2hlOiB0cnVlXHJcbiAgICBzdWNjZXNzOiAoZGF0YSkgLT5cclxuICAgICAgaWYgZGF0YVxyXG4gICAgICAgIGdldF9maW5hbmNpYWxfc3RhdGVtZW50cyBkYXRhLl9pZCwgKGRhdGEyLCB0ZXh0U3RhdHVzLCBqcVhIUikgLT5cclxuICAgICAgICAgIGRhdGEuZmluYW5jaWFsX3N0YXRlbWVudHMgPSBkYXRhMlxyXG4gICAgICAgICAgZ2V0X2VsZWN0ZWRfb2ZmaWNpYWxzIGRhdGEuX2lkLCAyNSwgKGRhdGEzLCB0ZXh0U3RhdHVzMiwganFYSFIyKSAtPlxyXG4gICAgICAgICAgICBkYXRhLmVsZWN0ZWRfb2ZmaWNpYWxzID0gZGF0YTNcclxuICAgICAgICAgICAgZ2V0X21heF9yYW5rcyAobWF4X3JhbmtzX3Jlc3BvbnNlKSAtPlxyXG4gICAgICAgICAgICAgIGRhdGEubWF4X3JhbmtzID0gbWF4X3JhbmtzX3Jlc3BvbnNlLnJlY29yZFswXVxyXG4gICAgICAgICAgICAgICQoJyNkZXRhaWxzJykuaHRtbCB0ZW1wbGF0ZXMuZ2V0X2h0bWwoMCwgZGF0YSlcclxuICAgICAgICAgICAgICBhY3RpdmF0ZV90YWIoKVxyXG4gICAgICAgICAgICAjZ292bWFwLmdlb2NvZGUgZGF0YVswXVxyXG4gICAgICByZXR1cm5cclxuICAgIGVycm9yOihlKSAtPlxyXG4gICAgICBjb25zb2xlLmxvZyBlXHJcblxyXG5cclxuZ2V0X2VsZWN0ZWRfb2ZmaWNpYWxzID0gKGdvdl9pZCwgbGltaXQsIG9uc3VjY2VzcykgLT5cclxuICAkLmFqYXhcclxuICAgIHVybDpcImh0dHA6Ly80Ni4xMDEuMy43OTo4MC9yZXN0L2RiL2VsZWN0ZWRfb2ZmaWNpYWxzXCJcclxuICAgIGRhdGE6XHJcbiAgICAgIGZpbHRlcjpcImdvdnNfaWQ9XCIgKyBnb3ZfaWRcclxuICAgICAgZmllbGRzOlwiZ292c19pZCx0aXRsZSxmdWxsX25hbWUsZW1haWxfYWRkcmVzcyxwaG90b191cmwsdGVybV9leHBpcmVzLHRlbGVwaG9uZV9udW1iZXJcIlxyXG4gICAgICBhcHBfbmFtZTpcImdvdndpa2lcIlxyXG4gICAgICBvcmRlcjpcImRpc3BsYXlfb3JkZXJcIlxyXG4gICAgICBsaW1pdDpsaW1pdFxyXG5cclxuICAgIGRhdGFUeXBlOiAnanNvbidcclxuICAgIGNhY2hlOiB0cnVlXHJcbiAgICBzdWNjZXNzOiBvbnN1Y2Nlc3NcclxuICAgIGVycm9yOihlKSAtPlxyXG4gICAgICBjb25zb2xlLmxvZyBlXHJcblxyXG5nZXRfZmluYW5jaWFsX3N0YXRlbWVudHMgPSAoZ292X2lkLCBvbnN1Y2Nlc3MpIC0+XHJcbiAgJC5hamF4XHJcbiAgICB1cmw6XCJodHRwOi8vNDYuMTAxLjMuNzk6ODAvcmVzdC9kYi9fcHJvYy9nZXRfZmluYW5jaWFsX3N0YXRlbWVudHNcIlxyXG4gICAgZGF0YTpcclxuICAgICAgYXBwX25hbWU6XCJnb3Z3aWtpXCJcclxuICAgICAgb3JkZXI6XCJjYXB0aW9uX2NhdGVnb3J5LGRpc3BsYXlfb3JkZXJcIlxyXG4gICAgICBwYXJhbXM6IFtcclxuICAgICAgICBuYW1lOiBcImdvdnNfaWRcIlxyXG4gICAgICAgIHBhcmFtX3R5cGU6IFwiSU5cIlxyXG4gICAgICAgIHZhbHVlOiBnb3ZfaWRcclxuICAgICAgXVxyXG5cclxuICAgIGRhdGFUeXBlOiAnanNvbidcclxuICAgIGNhY2hlOiB0cnVlXHJcbiAgICBzdWNjZXNzOiBvbnN1Y2Nlc3NcclxuICAgIGVycm9yOihlKSAtPlxyXG4gICAgICBjb25zb2xlLmxvZyBlXHJcblxyXG5cclxuZ2V0X21heF9yYW5rcyA9IChvbnN1Y2Nlc3MpIC0+XHJcbiAgJC5hamF4XHJcbiAgICB1cmw6J2h0dHA6Ly80Ni4xMDEuMy43OTo4MC9yZXN0L2RiL21heF9yYW5rcydcclxuICAgIGRhdGE6XHJcbiAgICAgIGFwcF9uYW1lOidnb3Z3aWtpJ1xyXG4gICAgZGF0YVR5cGU6ICdqc29uJ1xyXG4gICAgY2FjaGU6IHRydWVcclxuICAgIHN1Y2Nlc3M6IG9uc3VjY2Vzc1xyXG5cclxud2luZG93LkdPVldJS0kuc2hvd19yZWNvcmQgPShyZWMpPT5cclxuICAkKCcjZGV0YWlscycpLmh0bWwgdGVtcGxhdGVzLmdldF9odG1sKDAsIHJlYylcclxuICBhY3RpdmF0ZV90YWIoKVxyXG4gIEdPVldJS0kuc2hvd19kYXRhX3BhZ2UoKVxyXG4gIHJvdXRlci5uYXZpZ2F0ZShyZWMuX2lkKVxyXG5cclxuXHJcbndpbmRvdy5HT1ZXSUtJLnNob3dfcmVjb3JkMiA9KHJlYyk9PlxyXG4gIGdldF9lbGVjdGVkX29mZmljaWFscyByZWMuX2lkLCAyNSwgKGRhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSAtPlxyXG4gICAgcmVjLmVsZWN0ZWRfb2ZmaWNpYWxzID0gZGF0YVxyXG4gICAgJCgnI2RldGFpbHMnKS5odG1sIHRlbXBsYXRlcy5nZXRfaHRtbCgwLCByZWMpXHJcbiAgICBnZXRfcmVjb3JkMiByZWMuX2lkXHJcbiAgICBhY3RpdmF0ZV90YWIoKVxyXG4gICAgR09WV0lLSS5zaG93X2RhdGFfcGFnZSgpXHJcbiAgICByb3V0ZXIubmF2aWdhdGUgXCIje3JlYy5hbHRfbmFtZS5yZXBsYWNlKC8gL2csJ18nKX1cIlxyXG5cclxuXHJcblxyXG4jIyNcclxud2luZG93LnNob3dfcmVjID0gKHJlYyktPlxyXG4gICQoJyNkZXRhaWxzJykuaHRtbCB0ZW1wbGF0ZXMuZ2V0X2h0bWwoMCwgcmVjKVxyXG4gIGFjdGl2YXRlX3RhYigpXHJcbiMjI1xyXG5cclxuYnVpbGRfc2VsZWN0b3IgPSAoY29udGFpbmVyLCB0ZXh0LCBjb21tYW5kLCB3aGVyZV90b19zdG9yZV92YWx1ZSApIC0+XHJcbiAgJC5hamF4XHJcbiAgICB1cmw6ICdodHRwczovL2FwaS5tb25nb2xhYi5jb20vYXBpLzEvZGF0YWJhc2VzL2dvdndpa2kvcnVuQ29tbWFuZD9hcGlLZXk9MFk1WF9RazJ1T0pSZEhKV0pLU1JXazZsNkpxVlRTMnknXHJcbiAgICB0eXBlOiAnUE9TVCdcclxuICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb25cIlxyXG4gICAgZGF0YVR5cGU6ICdqc29uJ1xyXG4gICAgZGF0YTogY29tbWFuZCAjSlNPTi5zdHJpbmdpZnkoY29tbWFuZClcclxuICAgIGNhY2hlOiB0cnVlXHJcbiAgICBzdWNjZXNzOiAoZGF0YSkgPT5cclxuICAgICAgI2E9JC5leHRlbmQgdHJ1ZSBbXSxkYXRhXHJcbiAgICAgIHZhbHVlcz1kYXRhLnZhbHVlc1xyXG4gICAgICBidWlsZF9zZWxlY3RfZWxlbWVudCBjb250YWluZXIsIHRleHQsIHZhbHVlcy5zb3J0KCksIHdoZXJlX3RvX3N0b3JlX3ZhbHVlXHJcbiAgICAgIHJldHVyblxyXG4gICAgZXJyb3I6KGUpIC0+XHJcbiAgICAgIGNvbnNvbGUubG9nIGVcclxuXHJcblxyXG5idWlsZF9zZWxlY3RfZWxlbWVudCA9IChjb250YWluZXIsIHRleHQsIGFyciwgd2hlcmVfdG9fc3RvcmVfdmFsdWUgKSAtPlxyXG4gIHMgID0gXCI8c2VsZWN0IGNsYXNzPSdmb3JtLWNvbnRyb2wnIHN0eWxlPSdtYXh3aWR0aDoxNjBweDsnPjxvcHRpb24gdmFsdWU9Jyc+I3t0ZXh0fTwvb3B0aW9uPlwiXHJcbiAgcyArPSBcIjxvcHRpb24gdmFsdWU9JyN7dn0nPiN7dn08L29wdGlvbj5cIiBmb3IgdiBpbiBhcnIgd2hlbiB2XHJcbiAgcyArPSBcIjwvc2VsZWN0PlwiXHJcbiAgc2VsZWN0ID0gJChzKVxyXG4gICQoY29udGFpbmVyKS5hcHBlbmQoc2VsZWN0KVxyXG5cclxuICAjIHNldCBkZWZhdWx0ICdDQSdcclxuICBpZiB0ZXh0IGlzICdTdGF0ZS4uJ1xyXG4gICAgc2VsZWN0LnZhbCAnQ0EnXHJcbiAgICB3aW5kb3cuR09WV0lLSS5zdGF0ZV9maWx0ZXI9J0NBJ1xyXG4gICAgZ292bWFwLm9uX2JvdW5kc19jaGFuZ2VkX2xhdGVyKClcclxuXHJcbiAgc2VsZWN0LmNoYW5nZSAoZSkgLT5cclxuICAgIGVsID0gJChlLnRhcmdldClcclxuICAgIHdpbmRvdy5HT1ZXSUtJW3doZXJlX3RvX3N0b3JlX3ZhbHVlXSA9IGVsLnZhbCgpXHJcbiAgICAkKCcuZ292LWNvdW50ZXInKS50ZXh0IGdvdl9zZWxlY3Rvci5jb3VudF9nb3ZzKClcclxuICAgIGdvdm1hcC5vbl9ib3VuZHNfY2hhbmdlZCgpXHJcblxyXG5cclxuYWRqdXN0X3R5cGVhaGVhZF93aWR0aCA9KCkgLT5cclxuICBpbnAgPSAkKCcjbXlpbnB1dCcpXHJcbiAgcGFyID0gJCgnI3R5cGVhaGVkLWNvbnRhaW5lcicpXHJcbiAgaW5wLndpZHRoIHBhci53aWR0aCgpXHJcblxyXG5cclxuXHJcblxyXG5zdGFydF9hZGp1c3RpbmdfdHlwZWFoZWFkX3dpZHRoID0oKSAtPlxyXG4gICQod2luZG93KS5yZXNpemUgLT5cclxuICAgIGFkanVzdF90eXBlYWhlYWRfd2lkdGgoKVxyXG5cclxuXHJcbiMgYWRkIGxpdmUgcmVsb2FkIHRvIHRoZSBzaXRlLiBGb3IgZGV2ZWxvcG1lbnQgb25seS5cclxubGl2ZXJlbG9hZCA9IChwb3J0KSAtPlxyXG4gIHVybD13aW5kb3cubG9jYXRpb24ub3JpZ2luLnJlcGxhY2UgLzpbXjpdKiQvLCBcIlwiXHJcbiAgJC5nZXRTY3JpcHQgdXJsICsgXCI6XCIgKyBwb3J0LCA9PlxyXG4gICAgJCgnYm9keScpLmFwcGVuZCBcIlwiXCJcclxuICAgIDxkaXYgc3R5bGU9J3Bvc2l0aW9uOmFic29sdXRlO3otaW5kZXg6MTAwMDtcclxuICAgIHdpZHRoOjEwMCU7IHRvcDowO2NvbG9yOnJlZDsgdGV4dC1hbGlnbjogY2VudGVyO1xyXG4gICAgcGFkZGluZzoxcHg7Zm9udC1zaXplOjEwcHg7bGluZS1oZWlnaHQ6MSc+bGl2ZTwvZGl2PlxyXG4gICAgXCJcIlwiXHJcblxyXG5mb2N1c19zZWFyY2hfZmllbGQgPSAobXNlYykgLT5cclxuICBzZXRUaW1lb3V0ICgtPiAkKCcjbXlpbnB1dCcpLmZvY3VzKCkpICxtc2VjXHJcblxyXG5cclxuXHJcbiMgcXVpY2sgYW5kIGRpcnR5IGZpeCBmb3IgYmFjayBidXR0b24gaW4gYnJvd3NlclxyXG53aW5kb3cub25oYXNoY2hhbmdlID0gKGUpIC0+XHJcbiAgaD13aW5kb3cubG9jYXRpb24uaGFzaFxyXG4gICNjb25zb2xlLmxvZyBcIm9uSGFzaENoYW5nZSAje2h9XCJcclxuICAjY29uc29sZS5sb2cgZVxyXG4gIGlmIG5vdCBoXHJcbiAgICBHT1ZXSUtJLnNob3dfc2VhcmNoX3BhZ2UoKVxyXG5cclxuIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuXHJcbiN0ZW1wbGF0ZXMubG9hZF90ZW1wbGF0ZSBcInRhYnNcIiwgXCJjb25maWcvdGFibGF5b3V0Lmpzb25cIlxyXG50ZW1wbGF0ZXMubG9hZF9mdXNpb25fdGVtcGxhdGUgXCJ0YWJzXCIsIFwiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vZnVzaW9udGFibGVzL3YyL3F1ZXJ5P3NxbD1TRUxFQ1QlMjAqJTIwRlJPTSUyMDF6Mm9YUUVZUTNwMk9vTUk4VjVnS2dIV0I1VHo5OTBCclExeGMxdFZvJmtleT1BSXphU3lDWERReU1EcEdBMmczUWp1djRDRHY3elJqLWl4NElRSkFcIlxyXG5cclxuYnVpbGRfc2VsZWN0b3IoJy5zdGF0ZS1jb250YWluZXInICwgJ1N0YXRlLi4nICwgJ3tcImRpc3RpbmN0XCI6IFwiZ292c1wiLFwia2V5XCI6XCJzdGF0ZVwifScgLCAnc3RhdGVfZmlsdGVyJylcclxuYnVpbGRfc2VsZWN0b3IoJy5nb3YtdHlwZS1jb250YWluZXInICwgJ3R5cGUgb2YgZ292ZXJubWVudC4uJyAsICd7XCJkaXN0aW5jdFwiOiBcImdvdnNcIixcImtleVwiOlwiZ292X3R5cGVcIn0nICwgJ2dvdl90eXBlX2ZpbHRlcicpXHJcblxyXG5hZGp1c3RfdHlwZWFoZWFkX3dpZHRoKClcclxuc3RhcnRfYWRqdXN0aW5nX3R5cGVhaGVhZF93aWR0aCgpXHJcblxyXG4kKCcjYnRuQmFja1RvU2VhcmNoJykuY2xpY2sgKGUpLT5cclxuICBlLnByZXZlbnREZWZhdWx0KClcclxuICBHT1ZXSUtJLnNob3dfc2VhcmNoX3BhZ2UoKVxyXG5cclxuI2ZvY3VzX3NlYXJjaF9maWVsZCA1MDBcclxuXHJcblxyXG5cclxubGl2ZXJlbG9hZCBcIjkwOTBcIlxyXG5cclxuIiwiXHJcblxyXG5cclxuIyBUYWtlcyBhbiBhcnJheSBvZiBkb2NzIHRvIHNlYXJjaCBpbi5cclxuIyBSZXR1cm5zIGEgZnVuY3Rpb25zIHRoYXQgdGFrZXMgMiBwYXJhbXMgXHJcbiMgcSAtIHF1ZXJ5IHN0cmluZyBhbmQgXHJcbiMgY2IgLSBjYWxsYmFjayB0aGF0IHdpbGwgYmUgY2FsbGVkIHdoZW4gdGhlIHNlYXJjaCBpcyBkb25lLlxyXG4jIGNiIHJldHVybnMgYW4gYXJyYXkgb2YgbWF0Y2hpbmcgZG9jdW1lbnRzLlxyXG4jIG11bV9pdGVtcyAtIG1heCBudW1iZXIgb2YgZm91bmQgaXRlbXMgdG8gc2hvd1xyXG5RdWVyeU1hdGhlciA9IChkb2NzLCBudW1faXRlbXM9NSkgLT5cclxuICAocSwgY2IpIC0+XHJcbiAgICB0ZXN0X3N0cmluZyA9KHMsIHJlZ3MpIC0+XHJcbiAgICAgIChpZiBub3Qgci50ZXN0KHMpIHRoZW4gcmV0dXJuIGZhbHNlKSAgZm9yIHIgaW4gcmVnc1xyXG4gICAgICByZXR1cm4gdHJ1ZVxyXG5cclxuICAgIFt3b3JkcyxyZWdzXSA9IGdldF93b3Jkc19yZWdzIHFcclxuICAgIG1hdGNoZXMgPSBbXVxyXG4gICAgIyBpdGVyYXRlIHRocm91Z2ggdGhlIHBvb2wgb2YgZG9jcyBhbmQgZm9yIGFueSBzdHJpbmcgdGhhdFxyXG4gICAgIyBjb250YWlucyB0aGUgc3Vic3RyaW5nIGBxYCwgYWRkIGl0IHRvIHRoZSBgbWF0Y2hlc2AgYXJyYXlcclxuXHJcbiAgICBmb3IgZCBpbiBkb2NzXHJcbiAgICAgIGlmIG1hdGNoZXMubGVuZ3RoID49IG51bV9pdGVtcyB0aGVuIGJyZWFrXHJcbiAgICAgIGlmIEdPVldJS0kuc3RhdGVfZmlsdGVyIGFuZCBkLnN0YXRlIGlzbnQgR09WV0lLSS5zdGF0ZV9maWx0ZXIgdGhlbiBjb250aW51ZVxyXG4gICAgICBpZiBHT1ZXSUtJLmdvdl90eXBlX2ZpbHRlciBhbmQgZC5nb3ZfdHlwZSBpc250IEdPVldJS0kuZ292X3R5cGVfZmlsdGVyIHRoZW4gY29udGludWVcclxuXHJcbiAgICAgIGlmIHRlc3Rfc3RyaW5nKGQuZ292X25hbWUsIHJlZ3MpIFxyXG4gICAgICAgIG1hdGNoZXMucHVzaCAkLmV4dGVuZCh7fSwgZClcclxuICAgICAgI2lmIHRlc3Rfc3RyaW5nKFwiI3tkLmdvdl9uYW1lfSAje2Quc3RhdGV9ICN7ZC5nb3ZfdHlwZX0gI3tkLmluY19pZH1cIiwgcmVncykgdGhlbiBtYXRjaGVzLnB1c2ggJC5leHRlbmQoe30sIGQpXHJcbiAgICBcclxuICAgIHNlbGVjdF90ZXh0IG1hdGNoZXMsIHdvcmRzLCByZWdzXHJcbiAgICBjYiBtYXRjaGVzXHJcbiAgICByZXR1cm5cclxuIFxyXG5cclxuIyBpbnNlcnRzIDxzdHJvbmc+IGVsZW1lbnRzZSBpbiBhcnJheVxyXG5zZWxlY3RfdGV4dCA9IChjbG9uZXMsd29yZHMscmVncykgLT5cclxuICBmb3IgZCBpbiBjbG9uZXNcclxuICAgIGQuZ292X25hbWU9c3Ryb25naWZ5KGQuZ292X25hbWUsIHdvcmRzLCByZWdzKVxyXG4gICAgI2Quc3RhdGU9c3Ryb25naWZ5KGQuc3RhdGUsIHdvcmRzLCByZWdzKVxyXG4gICAgI2QuZ292X3R5cGU9c3Ryb25naWZ5KGQuZ292X3R5cGUsIHdvcmRzLCByZWdzKVxyXG4gIFxyXG4gIHJldHVybiBjbG9uZXNcclxuXHJcblxyXG5cclxuIyBpbnNlcnRzIDxzdHJvbmc+IGVsZW1lbnRzZVxyXG5zdHJvbmdpZnkgPSAocywgd29yZHMsIHJlZ3MpIC0+XHJcbiAgcmVncy5mb3JFYWNoIChyLGkpIC0+XHJcbiAgICBzID0gcy5yZXBsYWNlIHIsIFwiPGI+I3t3b3Jkc1tpXX08L2I+XCJcclxuICByZXR1cm4gc1xyXG5cclxuIyByZW1vdmVzIDw+IHRhZ3MgZnJvbSBhIHN0cmluZ1xyXG5zdHJpcCA9IChzKSAtPlxyXG4gIHMucmVwbGFjZSgvPFtePD5dKj4vZywnJylcclxuXHJcblxyXG4jIGFsbCB0aXJtcyBzcGFjZXMgZnJvbSBib3RoIHNpZGVzIGFuZCBtYWtlIGNvbnRyYWN0cyBzZXF1ZW5jZXMgb2Ygc3BhY2VzIHRvIDFcclxuZnVsbF90cmltID0gKHMpIC0+XHJcbiAgc3M9cy50cmltKCcnK3MpXHJcbiAgc3M9c3MucmVwbGFjZSgvICsvZywnICcpXHJcblxyXG4jIHJldHVybnMgYW4gYXJyYXkgb2Ygd29yZHMgaW4gYSBzdHJpbmdcclxuZ2V0X3dvcmRzID0gKHN0cikgLT5cclxuICBmdWxsX3RyaW0oc3RyKS5zcGxpdCgnICcpXHJcblxyXG5cclxuZ2V0X3dvcmRzX3JlZ3MgPSAoc3RyKSAtPlxyXG4gIHdvcmRzID0gZ2V0X3dvcmRzIHN0clxyXG4gIHJlZ3MgPSB3b3Jkcy5tYXAgKHcpLT4gbmV3IFJlZ0V4cChcIiN7d31cIiwnaScpXHJcbiAgW3dvcmRzLHJlZ3NdXHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBRdWVyeU1hdGhlclxyXG5cclxuIiwiXHJcbiMjI1xyXG4jIGZpbGU6IHRlbXBsYXRlczIuY29mZmVlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuI1xyXG4jIENsYXNzIHRvIG1hbmFnZSB0ZW1wbGF0ZXMgYW5kIHJlbmRlciBkYXRhIG9uIGh0bWwgcGFnZS5cclxuI1xyXG4jIFRoZSBtYWluIG1ldGhvZCA6IHJlbmRlcihkYXRhKSwgZ2V0X2h0bWwoZGF0YSlcclxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuIyMjXHJcblxyXG5cclxuXHJcbiMgTE9BRCBGSUVMRCBOQU1FU1xyXG5maWVsZE5hbWVzID0ge31cclxuZmllbGROYW1lc0hlbHAgPSB7fVxyXG5cclxuXHJcbnJlbmRlcl9maWVsZF92YWx1ZSA9IChuLG1hc2ssZGF0YSkgLT5cclxuICB2PWRhdGFbbl1cclxuICBpZiBub3QgZGF0YVtuXVxyXG4gICAgcmV0dXJuICcnXHJcblxyXG4gIGlmIG4gPT0gXCJ3ZWJfc2l0ZVwiXHJcbiAgICByZXR1cm4gXCI8YSB0YXJnZXQ9J19ibGFuaycgaHJlZj0nI3t2fSc+I3t2fTwvYT5cIlxyXG4gIGVsc2VcclxuICAgIGlmICcnICE9IG1hc2tcclxuICAgICAgaWYgZGF0YVtuKydfcmFuayddIGFuZCBkYXRhLm1heF9yYW5rcyBhbmQgZGF0YS5tYXhfcmFua3NbbisnX21heF9yYW5rJ11cclxuICAgICAgICB2ID0gbnVtZXJhbCh2KS5mb3JtYXQobWFzaylcclxuICAgICAgICByZXR1cm4gXCIje3Z9IDxzcGFuIGNsYXNzPSdyYW5rJz4oI3tkYXRhW24rJ19yYW5rJ119IG9mICN7ZGF0YS5tYXhfcmFua3NbbisnX21heF9yYW5rJ119KTwvc3Bhbj5cIlxyXG4gICAgICByZXR1cm4gbnVtZXJhbCh2KS5mb3JtYXQobWFzaylcclxuICAgIGVsc2VcclxuICAgICAgaWYgdi5sZW5ndGggPiAyMCBhbmRcclxuICAgICAgbiA9PSBcIm9wZW5fZW5yb2xsbWVudF9zY2hvb2xzXCJcclxuICAgICAgdGhlbiB2ID0gdi5zdWJzdHJpbmcoMCwgMTkpICsgXCI8ZGl2IHN0eWxlPSdkaXNwbGF5OmlubGluZTtjb2xvcjojMDc0ZDcxJyAgdGl0bGU9JyN7dn0nPiZoZWxsaXA7PC9kaXY+XCJcclxuICAgICAgZWxzZVxyXG4gICAgICAgIGlmIHYubGVuZ3RoID4gMjFcclxuICAgICAgICB0aGVuIHYgPSB2LnN1YnN0cmluZygwLCAyMSlcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgcmV0dXJuIHZcclxuXHJcblxyXG5yZW5kZXJfZmllbGRfbmFtZV9oZWxwID0gKGZOYW1lKSAtPlxyXG4gICNpZiBmaWVsZE5hbWVzSGVscFtmTmFtZV1cclxuICAgIHJldHVybiBmaWVsZE5hbWVzSGVscFtmTmFtZV1cclxuXHJcbnJlbmRlcl9maWVsZF9uYW1lID0gKGZOYW1lKSAtPlxyXG4gIGlmIGZpZWxkTmFtZXNbZk5hbWVdP1xyXG4gICAgcmV0dXJuIGZpZWxkTmFtZXNbZk5hbWVdXHJcblxyXG4gIHMgPSBmTmFtZS5yZXBsYWNlKC9fL2csXCIgXCIpXHJcbiAgcyA9IHMuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzLnN1YnN0cmluZygxKVxyXG4gIHJldHVybiBzXHJcblxyXG5cclxucmVuZGVyX2ZpZWxkID0gKGZOYW1lLGRhdGEpLT5cclxuICBpZiBcIl9cIiA9PSBzdWJzdHIgZk5hbWUsIDAsIDFcclxuICAgIFwiXCJcIlxyXG4gICAgPGRpdj5cclxuICAgICAgICA8c3BhbiBjbGFzcz0nZi1uYW0nID4je3JlbmRlcl9maWVsZF9uYW1lIGZOYW1lfTwvc3Bhbj5cclxuICAgICAgICA8c3BhbiBjbGFzcz0nZi12YWwnPiZuYnNwOzwvc3Bhbj5cclxuICAgIDwvZGl2PlxyXG4gICAgXCJcIlwiXHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuICcnIHVubGVzcyBmVmFsdWUgPSBkYXRhW2ZOYW1lXVxyXG4gICAgXCJcIlwiXHJcbiAgICA8ZGl2PlxyXG4gICAgICAgIDxzcGFuIGNsYXNzPSdmLW5hbScgID4je3JlbmRlcl9maWVsZF9uYW1lIGZOYW1lfTxkaXY+PC9zcGFuPlxyXG4gICAgICAgIDxzcGFuIGNsYXNzPSdmLXZhbCc+I3tyZW5kZXJfZmllbGRfdmFsdWUoZk5hbWUsZGF0YSl9PC9zcGFuPlxyXG4gICAgPC9kaXY+XHJcbiAgICBcIlwiXCJcclxuXHJcbnJlbmRlcl9zdWJoZWFkaW5nID0gKGZOYW1lLCBtYXNrLCBub3RGaXJzdCktPlxyXG4gIHMgPSAnJ1xyXG4gIGZOYW1lID0gcmVuZGVyX2ZpZWxkX25hbWUgZk5hbWVcclxuICBpZiBtYXNrID09IFwiaGVhZGluZ1wiXHJcbiAgICBpZiBub3RGaXJzdCAhPSAwXHJcbiAgICAgIHMgKz0gXCI8YnIvPlwiXHJcbiAgICBzICs9IFwiPGRpdj48c3BhbiBjbGFzcz0nZi1uYW0nPiN7Zk5hbWV9PC9zcGFuPjxzcGFuIGNsYXNzPSdmLXZhbCc+IDwvc3Bhbj48L2Rpdj5cIlxyXG4gIHJldHVybiBzXHJcblxyXG5yZW5kZXJfZmllbGRzID0gKGZpZWxkcyxkYXRhLHRlbXBsYXRlKS0+XHJcbiAgaCA9ICcnXHJcbiAgZm9yIGZpZWxkLGkgaW4gZmllbGRzXHJcbiAgICBpZiAodHlwZW9mIGZpZWxkIGlzIFwib2JqZWN0XCIpXHJcbiAgICAgIGlmIGZpZWxkLm1hc2sgPT0gXCJoZWFkaW5nXCJcclxuICAgICAgICBoICs9IHJlbmRlcl9zdWJoZWFkaW5nKGZpZWxkLm5hbWUsIGZpZWxkLm1hc2ssIGkpXHJcbiAgICAgICAgZlZhbHVlID0gJydcclxuICAgICAgZWxzZVxyXG4gICAgICAgIGZWYWx1ZSA9IHJlbmRlcl9maWVsZF92YWx1ZSBmaWVsZC5uYW1lLCBmaWVsZC5tYXNrLCBkYXRhXHJcbiAgICAgICAgaWYgKCcnICE9IGZWYWx1ZSBhbmQgZlZhbHVlICE9ICcwJylcclxuICAgICAgICAgIGZOYW1lID0gcmVuZGVyX2ZpZWxkX25hbWUgZmllbGQubmFtZVxyXG4gICAgICAgICAgZk5hbWVIZWxwID0gcmVuZGVyX2ZpZWxkX25hbWVfaGVscCBmaWVsZC5uYW1lXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgZlZhbHVlID0gJydcclxuXHJcbiAgICBlbHNlXHJcbiAgICAgIGZWYWx1ZSA9IHJlbmRlcl9maWVsZF92YWx1ZSBmaWVsZCwgJycsIGRhdGFcclxuICAgICAgaWYgKCcnICE9IGZWYWx1ZSlcclxuICAgICAgICBmTmFtZSA9IHJlbmRlcl9maWVsZF9uYW1lIGZpZWxkXHJcbiAgICAgICAgZk5hbWVIZWxwID0gcmVuZGVyX2ZpZWxkX25hbWVfaGVscCBmTmFtZVxyXG4gICAgaWYgKCcnICE9IGZWYWx1ZSlcclxuICAgICAgaCArPSB0ZW1wbGF0ZShuYW1lOiBmTmFtZSwgdmFsdWU6IGZWYWx1ZSwgaGVscDogZk5hbWVIZWxwKVxyXG4gIHJldHVybiBoXHJcblxyXG5yZW5kZXJfZmluYW5jaWFsX2ZpZWxkcyA9IChkYXRhLHRlbXBsYXRlKS0+XHJcbiAgaCA9ICcnXHJcbiAgbWFzayA9ICcwLDAnXHJcbiAgY2F0ZWdvcnkgPSAnJ1xyXG4gIGlzX2ZpcnN0X3JvdyA9IGZhbHNlXHJcbiAgZm9yIGZpZWxkIGluIGRhdGFcclxuICAgIGlmIGNhdGVnb3J5ICE9IGZpZWxkLmNhdGVnb3J5X25hbWVcclxuICAgICAgY2F0ZWdvcnkgPSBmaWVsZC5jYXRlZ29yeV9uYW1lXHJcbiAgICAgIGlmIGNhdGVnb3J5ID09ICdPdmVydmlldydcclxuICAgICAgICBoICs9IHRlbXBsYXRlKG5hbWU6IFwiPGI+XCIgKyBjYXRlZ29yeSArIFwiPC9iPlwiLCBnZW5mdW5kOiAnJywgb3RoZXJmdW5kczogJycsIHRvdGFsZnVuZHM6ICcnKVxyXG4gICAgICBlbHNlIGlmIGNhdGVnb3J5ID09ICdSZXZlbnVlcydcclxuICAgICAgICBoICs9ICc8L2JyPidcclxuICAgICAgICBoICs9IFwiPGI+XCIgKyB0ZW1wbGF0ZShuYW1lOiBjYXRlZ29yeSwgZ2VuZnVuZDogXCJHZW5lcmFsIEZ1bmRcIiwgb3RoZXJmdW5kczogXCJPdGhlciBGdW5kc1wiLCB0b3RhbGZ1bmRzOiBcIlRvdGFsIEdvdi4gRnVuZHNcIikgKyBcIjwvYj5cIlxyXG4gICAgICAgIGlzX2ZpcnN0X3JvdyA9IHRydWVcclxuICAgICAgZWxzZVxyXG4gICAgICAgIGggKz0gJzwvYnI+J1xyXG4gICAgICAgIGggKz0gdGVtcGxhdGUobmFtZTogXCI8Yj5cIiArIGNhdGVnb3J5ICsgXCI8L2I+XCIsIGdlbmZ1bmQ6ICcnLCBvdGhlcmZ1bmRzOiAnJywgdG90YWxmdW5kczogJycpXHJcbiAgICAgICAgaXNfZmlyc3Rfcm93ID0gdHJ1ZVxyXG5cclxuICAgIGlmIGZpZWxkLmNhcHRpb24gPT0gJ0dlbmVyYWwgRnVuZCBCYWxhbmNlJyBvciBmaWVsZC5jYXB0aW9uID09ICdMb25nIFRlcm0gRGVidCdcclxuICAgICAgaCArPSB0ZW1wbGF0ZShuYW1lOiBmaWVsZC5jYXB0aW9uLCBnZW5mdW5kOiBjdXJyZW5jeShmaWVsZC5nZW5mdW5kLCBtYXNrLCAnPHNwYW4gY2xhc3M9XCJjdXJyZW5jeS1zaWduXCI+JDwvc3Bhbj4nKSlcclxuICAgIGVsc2UgaWYgZmllbGQuY2FwdGlvbiBpbiBbJ1RvdGFsIFJldmVudWVzJywgJ1RvdGFsIEV4cGVuZGl0dXJlcycsICdTdXJwbHVzIC8gKERlZmljaXQpJ10gb3IgaXNfZmlyc3Rfcm93XHJcbiAgICAgIGggKz0gdGVtcGxhdGUobmFtZTogZmllbGQuY2FwdGlvbiwgZ2VuZnVuZDogY3VycmVuY3koZmllbGQuZ2VuZnVuZCwgbWFzaywgJzxzcGFuIGNsYXNzPVwiY3VycmVuY3ktc2lnblwiPiQ8L3NwYW4+JyksIG90aGVyZnVuZHM6IGN1cnJlbmN5KGZpZWxkLm90aGVyZnVuZHMsIG1hc2ssICc8c3BhbiBjbGFzcz1cImN1cnJlbmN5LXNpZ25cIj4kPC9zcGFuPicpLCB0b3RhbGZ1bmRzOiBjdXJyZW5jeShmaWVsZC50b3RhbGZ1bmRzLCBtYXNrLCAnPHNwYW4gY2xhc3M9XCJjdXJyZW5jeS1zaWduXCI+JDwvc3Bhbj4nKSlcclxuICAgICAgaXNfZmlyc3Rfcm93ID0gZmFsc2VcclxuICAgIGVsc2VcclxuICAgICAgaCArPSB0ZW1wbGF0ZShuYW1lOiBmaWVsZC5jYXB0aW9uLCBnZW5mdW5kOiBjdXJyZW5jeShmaWVsZC5nZW5mdW5kLCBtYXNrKSwgb3RoZXJmdW5kczogY3VycmVuY3koZmllbGQub3RoZXJmdW5kcywgbWFzayksIHRvdGFsZnVuZHM6IGN1cnJlbmN5KGZpZWxkLnRvdGFsZnVuZHMsIG1hc2spKVxyXG4gIHJldHVybiBoXHJcblxyXG51bmRlciA9IChzKSAtPiBzLnJlcGxhY2UoL1tcXHNcXCtcXC1dL2csICdfJylcclxuXHJcbnRvVGl0bGVDYXNlID0gKHN0cikgLT5cclxuICBzdHIucmVwbGFjZSAvXFx3XFxTKi9nLCAodHh0KSAtPlxyXG4gICAgdHh0LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdHh0LnN1YnN0cigxKS50b0xvd2VyQ2FzZSgpXHJcblxyXG5jdXJyZW5jeSA9IChuLCBtYXNrLCBzaWduID0gJycpIC0+XHJcbiAgICBuID0gbnVtZXJhbChuKVxyXG4gICAgaWYgbiA8IDBcclxuICAgICAgICBzID0gbi5mb3JtYXQobWFzaykudG9TdHJpbmcoKVxyXG4gICAgICAgIHMgPSBzLnJlcGxhY2UoLy0vZywgJycpXHJcbiAgICAgICAgcmV0dXJuIFwiKCN7c2lnbn0jeyc8c3BhbiBjbGFzcz1cImZpbi12YWxcIj4nK3MrJzwvc3Bhbj4nfSlcIlxyXG5cclxuICAgIG4gPSBuLmZvcm1hdChtYXNrKVxyXG4gICAgcmV0dXJuIFwiI3tzaWdufSN7JzxzcGFuIGNsYXNzPVwiZmluLXZhbFwiPicrbisnPC9zcGFuPid9XCJcclxuXHJcbnJlbmRlcl90YWJzID0gKGluaXRpYWxfbGF5b3V0LCBkYXRhLCB0YWJzZXQsIHBhcmVudCkgLT5cclxuICAjbGF5b3V0ID0gYWRkX290aGVyX3RhYl90b19sYXlvdXQgaW5pdGlhbF9sYXlvdXQsIGRhdGFcclxuICBsYXlvdXQgPSBpbml0aWFsX2xheW91dFxyXG4gIHRlbXBsYXRlcyA9IHBhcmVudC50ZW1wbGF0ZXNcclxuICBwbG90X2hhbmRsZXMgPSB7fVxyXG5cclxuICBsYXlvdXRfZGF0YSA9XHJcbiAgICB0aXRsZTogZGF0YS5nb3ZfbmFtZVxyXG4gICAgd2lraXBlZGlhX3BhZ2VfZXhpc3RzOiBkYXRhLndpa2lwZWRpYV9wYWdlX2V4aXN0c1xyXG4gICAgd2lraXBlZGlhX3BhZ2VfbmFtZTogIGRhdGEud2lraXBlZGlhX3BhZ2VfbmFtZVxyXG4gICAgdHJhbnNwYXJlbnRfY2FsaWZvcm5pYV9wYWdlX25hbWU6IGRhdGEudHJhbnNwYXJlbnRfY2FsaWZvcm5pYV9wYWdlX25hbWVcclxuICAgIGxhdGVzdF9hdWRpdF91cmw6IGRhdGEubGF0ZXN0X2F1ZGl0X3VybFxyXG4gICAgdGFiczogW11cclxuICAgIHRhYmNvbnRlbnQ6ICcnXHJcblxyXG4gIGZvciB0YWIsaSBpbiBsYXlvdXRcclxuICAgIGxheW91dF9kYXRhLnRhYnMucHVzaFxyXG4gICAgICB0YWJpZDogdW5kZXIodGFiLm5hbWUpLFxyXG4gICAgICB0YWJuYW1lOiB0YWIubmFtZSxcclxuICAgICAgYWN0aXZlOiAoaWYgaT4wIHRoZW4gJycgZWxzZSAnYWN0aXZlJylcclxuXHJcbiAgZm9yIHRhYixpIGluIGxheW91dFxyXG4gICAgZGV0YWlsX2RhdGEgPVxyXG4gICAgICB0YWJpZDogdW5kZXIodGFiLm5hbWUpLFxyXG4gICAgICB0YWJuYW1lOiB0YWIubmFtZSxcclxuICAgICAgYWN0aXZlOiAoaWYgaT4wIHRoZW4gJycgZWxzZSAnYWN0aXZlJylcclxuICAgICAgdGFiY29udGVudDogJydcclxuICAgIHN3aXRjaCB0YWIubmFtZVxyXG4gICAgICB3aGVuICdPdmVydmlldyArIEVsZWN0ZWQgT2ZmaWNpYWxzJ1xyXG4gICAgICAgIGRldGFpbF9kYXRhLnRhYmNvbnRlbnQgKz0gcmVuZGVyX2ZpZWxkcyB0YWIuZmllbGRzLCBkYXRhLCB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC1uYW1ldmFsdWUtdGVtcGxhdGUnXVxyXG4gICAgICAgIGZvciBvZmZpY2lhbCxpIGluIGRhdGEuZWxlY3RlZF9vZmZpY2lhbHMucmVjb3JkXHJcbiAgICAgICAgICBvZmZpY2lhbF9kYXRhID1cclxuICAgICAgICAgICAgdGl0bGU6IGlmICcnICE9IG9mZmljaWFsLnRpdGxlIHRoZW4gXCJUaXRsZTogXCIgKyBvZmZpY2lhbC50aXRsZVxyXG4gICAgICAgICAgICBuYW1lOiBpZiAnJyAhPSBvZmZpY2lhbC5mdWxsX25hbWUgdGhlbiBcIk5hbWU6IFwiICsgb2ZmaWNpYWwuZnVsbF9uYW1lXHJcbiAgICAgICAgICAgIGVtYWlsOiBpZiBudWxsICE9IG9mZmljaWFsLmVtYWlsX2FkZHJlc3MgdGhlbiBcIkVtYWlsOiBcIiArIG9mZmljaWFsLmVtYWlsX2FkZHJlc3NcclxuICAgICAgICAgICAgdGVsZXBob25lbnVtYmVyOiBpZiBudWxsICE9IG9mZmljaWFsLnRlbGVwaG9uZV9udW1iZXIgYW5kIHVuZGVmaW5lZCAhPSBvZmZpY2lhbC50ZWxlcGhvbmVfbnVtYmVyIHRoZW4gXCJUZWxlcGhvbmUgTnVtYmVyOiBcIiArIG9mZmljaWFsLnRlbGVwaG9uZV9udW1iZXJcclxuICAgICAgICAgICAgdGVybWV4cGlyZXM6IGlmIG51bGwgIT0gb2ZmaWNpYWwudGVybV9leHBpcmVzIHRoZW4gXCJUZXJtIEV4cGlyZXM6IFwiICsgb2ZmaWNpYWwudGVybV9leHBpcmVzXHJcblxyXG4gICAgICAgICAgaWYgJycgIT0gb2ZmaWNpYWwucGhvdG9fdXJsIGFuZCBvZmZpY2lhbC5waG90b191cmwgIT0gbnVsbCB0aGVuIG9mZmljaWFsX2RhdGEuaW1hZ2UgPSAgJzxpbWcgc3JjPVwiJytvZmZpY2lhbC5waG90b191cmwrJ1wiIGNsYXNzPVwicG9ydHJhaXRcIiBhbHQ9XCJcIiAvPidcclxuICAgICAgICAgIGRldGFpbF9kYXRhLnRhYmNvbnRlbnQgKz0gdGVtcGxhdGVzWyd0YWJkZXRhaWwtb2ZmaWNpYWwtdGVtcGxhdGUnXShvZmZpY2lhbF9kYXRhKVxyXG4gICAgICB3aGVuICdFbXBsb3llZSBDb21wZW5zYXRpb24nXHJcbiAgICAgICAgaCA9ICcnXHJcbiAgICAgICAgaCArPSByZW5kZXJfZmllbGRzIHRhYi5maWVsZHMsIGRhdGEsIHRlbXBsYXRlc1sndGFiZGV0YWlsLW5hbWV2YWx1ZS10ZW1wbGF0ZSddXHJcbiAgICAgICAgZGV0YWlsX2RhdGEudGFiY29udGVudCArPSB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC1lbXBsb3llZS1jb21wLXRlbXBsYXRlJ10oY29udGVudDogaClcclxuICAgICAgICBpZiBub3QgcGxvdF9oYW5kbGVzWydtZWRpYW4tY29tcC1ncmFwaCddXHJcbiAgICAgICAgICBncmFwaCA9IHRydWVcclxuICAgICAgICAgIGlmIGRhdGFbJ21lZGlhbl9zYWxhcnlfcGVyX2Z1bGxfdGltZV9lbXAnXSA9PSAwXHJcbiAgICAgICAgICAgIGdyYXBoID0gZmFsc2VcclxuICAgICAgICAgIGlmIGRhdGFbJ21lZGlhbl9iZW5lZml0c19wZXJfZnRfZW1wJ10gPT0gMFxyXG4gICAgICAgICAgICBncmFwaCA9IGZhbHNlXHJcbiAgICAgICAgICBpZiBkYXRhWydtZWRpYW5fd2FnZXNfZ2VuZXJhbF9wdWJsaWMnXSA9PSAwXHJcbiAgICAgICAgICAgIGdyYXBoID0gZmFsc2VcclxuICAgICAgICAgIGlmIGRhdGFbJ21lZGlhbl9iZW5lZml0c19nZW5lcmFsX3B1YmxpYyddID09IDBcclxuICAgICAgICAgICAgZ3JhcGggPSBmYWxzZVxyXG4gICAgICAgICAgZHJhd0NoYXJ0ID0gKCkgLT5cclxuICAgICAgICAgICAgc2V0VGltZW91dCAoIC0+XHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uRGF0YVRhYmxlKClcclxuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRDb2x1bW4gJ3N0cmluZycsICdNZWRpYW4gQ29tcGVuc2F0aW9uJ1xyXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnbnVtYmVyJywgJ1dhZ2VzJ1xyXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnbnVtYmVyJywgJ0JlbnMuJ1xyXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZFJvd3MgW1xyXG4gICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICB0b1RpdGxlQ2FzZSBkYXRhLmdvdl9uYW1lICsgJ1xcbiBFbXBsb3llZXMnXHJcbiAgICAgICAgICAgICAgICAgIGRhdGFbJ21lZGlhbl9zYWxhcnlfcGVyX2Z1bGxfdGltZV9lbXAnXVxyXG4gICAgICAgICAgICAgICAgICBkYXRhWydtZWRpYW5fYmVuZWZpdHNfcGVyX2Z0X2VtcCddXHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICdBbGwgXFxuJyArIHRvVGl0bGVDYXNlIGRhdGEuZ292X25hbWUgKyAnIFxcbiBSZXNpZGVudHMnXHJcbiAgICAgICAgICAgICAgICAgIGRhdGFbJ21lZGlhbl93YWdlc19nZW5lcmFsX3B1YmxpYyddXHJcbiAgICAgICAgICAgICAgICAgIGRhdGFbJ21lZGlhbl9iZW5lZml0c19nZW5lcmFsX3B1YmxpYyddXHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgIGZvcm1hdHRlciA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5OdW1iZXJGb3JtYXQoZ3JvdXBpbmdTeW1ib2w6ICcsJyAsIGZyYWN0aW9uRGlnaXRzOiAnMCcpXHJcbiAgICAgICAgICAgICAgZm9ybWF0dGVyLmZvcm1hdCh2aXNfZGF0YSwgMSk7XHJcbiAgICAgICAgICAgICAgZm9ybWF0dGVyLmZvcm1hdCh2aXNfZGF0YSwgMik7XHJcbiAgICAgICAgICAgICAgb3B0aW9ucyA9XHJcbiAgICAgICAgICAgICAgICAndGl0bGUnOidNZWRpYW4gVG90YWwgQ29tcGVuc2F0aW9uIC0gRnVsbCBUaW1lIFdvcmtlcnM6IFxcbiBHb3Zlcm5tZW50IHZzLiBQcml2YXRlIFNlY3RvcidcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6IDM0MFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6IDMwMFxyXG4gICAgICAgICAgICAgICAgJ2lzU3RhY2tlZCc6ICd0cnVlJ1xyXG4gICAgICAgICAgICAgICAgJ2NvbG9ycyc6IFsnIzAwNWNlNicsICcjMDA5OTMzJ11cclxuICAgICAgICAgICAgICBjaGFydCA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5Db2x1bW5DaGFydCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAnbWVkaWFuLWNvbXAtZ3JhcGgnXHJcbiAgICAgICAgICAgICAgY2hhcnQuZHJhdyB2aXNfZGF0YSwgb3B0aW9uc1xyXG4gICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICApLCAxMDAwXHJcbiAgICAgICAgICBpZiBncmFwaFxyXG4gICAgICAgICAgICBnb29nbGUubG9hZCAndmlzdWFsaXphdGlvbicsICcxLjAnLFxyXG4gICAgICAgICAgICAnY2FsbGJhY2snIDogZHJhd0NoYXJ0KClcclxuICAgICAgICAgICAgJ3BhY2thZ2VzJyA6J2NvcmVjaGFydCdcclxuICAgICAgICAgIHBsb3RfaGFuZGxlc1snbWVkaWFuLWNvbXAtZ3JhcGgnXSA9J21lZGlhbi1jb21wLWdyYXBoJ1xyXG4gICAgICAgIGlmIG5vdCBwbG90X2hhbmRsZXNbJ21lZGlhbi1wZW5zaW9uLWdyYXBoJ11cclxuICAgICAgICAgIGdyYXBoID0gdHJ1ZVxyXG4gICAgICAgICAgaWYgZGF0YVsnbWVkaWFuX3BlbnNpb25fMzBfeWVhcl9yZXRpcmVlJ10gPT0gMFxyXG4gICAgICAgICAgICBncmFwaCA9IGZhbHNlXHJcbiAgICAgICAgICBkcmF3Q2hhcnQgPSAoKSAtPlxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0ICggLT5cclxuICAgICAgICAgICAgICB2aXNfZGF0YSA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5EYXRhVGFibGUoKVxyXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnc3RyaW5nJywgJ01lZGlhbiBQZW5zaW9uJ1xyXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnbnVtYmVyJywgJ1dhZ2VzJ1xyXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZFJvd3MgW1xyXG4gICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICAnUGVuc2lvbiBmb3IgXFxuIFJldGlyZWUgdy8gMzAgWWVhcnMnXHJcbiAgICAgICAgICAgICAgICAgIGRhdGFbJ21lZGlhbl9wZW5zaW9uXzMwX3llYXJfcmV0aXJlZSddXHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgIGZvcm1hdHRlciA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5OdW1iZXJGb3JtYXQoZ3JvdXBpbmdTeW1ib2w6ICcsJyAsIGZyYWN0aW9uRGlnaXRzOiAnMCcpXHJcbiAgICAgICAgICAgICAgZm9ybWF0dGVyLmZvcm1hdCh2aXNfZGF0YSwgMSk7XHJcbiAgICAgICAgICAgICAgb3B0aW9ucyA9XHJcbiAgICAgICAgICAgICAgICAndGl0bGUnOidNZWRpYW4gVG90YWwgUGVuc2lvbidcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6IDM0MFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6IDMwMFxyXG4gICAgICAgICAgICAgICAgJ2lzU3RhY2tlZCc6ICd0cnVlJ1xyXG4gICAgICAgICAgICAgICAgJ2NvbG9ycyc6IFsnIzAwNWNlNicsICcjMDA5OTMzJ11cclxuICAgICAgICAgICAgICAgICdjaGFydEFyZWEud2lkdGgnOiAnNTAlJ1xyXG4gICAgICAgICAgICAgIGlmIGdyYXBoXHJcbiAgICAgICAgICAgICAgICBjaGFydCA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5Db2x1bW5DaGFydCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAnbWVkaWFuLXBlbnNpb24tZ3JhcGgnXHJcbiAgICAgICAgICAgICAgICBjaGFydC5kcmF3IHZpc19kYXRhLCBvcHRpb25zXHJcbiAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgICksIDEwMDBcclxuICAgICAgICAgIGdvb2dsZS5sb2FkICd2aXN1YWxpemF0aW9uJywgJzEuMCcsXHJcbiAgICAgICAgICAnY2FsbGJhY2snIDogZHJhd0NoYXJ0KClcclxuICAgICAgICAgICdwYWNrYWdlcycgOidjb3JlY2hhcnQnXHJcbiAgICAgICAgICBwbG90X2hhbmRsZXNbJ21lZGlhbi1wZW5zaW9uLWdyYXBoJ10gPSdtZWRpYW4tcGVuc2lvbi1ncmFwaCdcclxuICAgICAgd2hlbiAnRmluYW5jaWFsIEhlYWx0aCdcclxuICAgICAgICBoID0gJydcclxuICAgICAgICBoICs9IHJlbmRlcl9maWVsZHMgdGFiLmZpZWxkcywgZGF0YSwgdGVtcGxhdGVzWyd0YWJkZXRhaWwtbmFtZXZhbHVlLXRlbXBsYXRlJ11cclxuICAgICAgICBkZXRhaWxfZGF0YS50YWJjb250ZW50ICs9IHRlbXBsYXRlc1sndGFiZGV0YWlsLWZpbmFuY2lhbC1oZWFsdGgtdGVtcGxhdGUnXShjb250ZW50OiBoKVxyXG4gICAgICAgICNwdWJsaWMgc2FmZXR5IHBpZVxyXG4gICAgICAgIGlmIG5vdCBwbG90X2hhbmRsZXNbJ3B1YmxpYy1zYWZldHktcGllJ10gYW5kIGRhdGFbJ2FsdF90eXBlJ10gIT0gJ1NjaG9vbCBEaXN0cmljdCdcclxuICAgICAgICAgIGdyYXBoID0gdHJ1ZVxyXG4gICAgICAgICAgaWYgZGF0YVsncHVibGljX3NhZmV0eV9leHBfb3Zlcl90b3RfZ292X2Z1bmRfcmV2ZW51ZSddID09IDBcclxuICAgICAgICAgICAgZ3JhcGggPSBmYWxzZVxyXG4gICAgICAgICAgZHJhd0NoYXJ0ID0gKCkgLT5cclxuICAgICAgICAgICAgc2V0VGltZW91dCAoIC0+XHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uRGF0YVRhYmxlKClcclxuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRDb2x1bW4gJ3N0cmluZycsICdQdWJsaWMgU2FmZXR5IEV4cGVuc2UnXHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdudW1iZXInLCAnVG90YWwnXHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkUm93cyBbXHJcbiAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICdQdWJsaWMgU2FmZXR5IEV4cCdcclxuICAgICAgICAgICAgICAgICAgMSAtIGRhdGFbJ3B1YmxpY19zYWZldHlfZXhwX292ZXJfdG90X2dvdl9mdW5kX3JldmVudWUnXVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICAnT3RoZXInXHJcbiAgICAgICAgICAgICAgICAgIGRhdGFbJ3B1YmxpY19zYWZldHlfZXhwX292ZXJfdG90X2dvdl9mdW5kX3JldmVudWUnXVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICBvcHRpb25zID1cclxuICAgICAgICAgICAgICAgICd0aXRsZSc6J1B1YmxpYyBzYWZldHkgZXhwZW5zZSdcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6IDM0MFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6IDMwMFxyXG4gICAgICAgICAgICAgICAgJ2lzM0QnIDogJ3RydWUnXHJcbiAgICAgICAgICAgICAgICAnY29sb3JzJzogWycjMDA1Y2U2JywgJyMwMDk5MzMnXVxyXG4gICAgICAgICAgICAgICAgJ3NsaWNlcyc6IHsgMToge29mZnNldDogMC4yfX1cclxuICAgICAgICAgICAgICAgICdwaWVTdGFydEFuZ2xlJzogNDVcclxuICAgICAgICAgICAgICBjaGFydCA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5QaWVDaGFydCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAncHVibGljLXNhZmV0eS1waWUnXHJcbiAgICAgICAgICAgICAgY2hhcnQuZHJhdyB2aXNfZGF0YSwgb3B0aW9uc1xyXG4gICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICApLCAxMDAwXHJcbiAgICAgICAgICBpZiBncmFwaFxyXG4gICAgICAgICAgICBnb29nbGUubG9hZCAndmlzdWFsaXphdGlvbicsICcxLjAnLFxyXG4gICAgICAgICAgICAnY2FsbGJhY2snIDogZHJhd0NoYXJ0KClcclxuICAgICAgICAgICAgJ3BhY2thZ2VzJyA6J2NvcmVjaGFydCdcclxuICAgICAgICAgIHBsb3RfaGFuZGxlc1sncHVibGljLXNhZmV0eS1waWUnXSA9J3B1YmxpYy1zYWZldHktcGllJ1xyXG4gICAgICAgICNmaW4taGVhbHRoLXJldmVudWUgZ3JhcGhcclxuICAgICAgICBpZiBub3QgcGxvdF9oYW5kbGVzWydmaW4taGVhbHRoLXJldmVudWUtZ3JhcGgnXSBhbmQgZGF0YVsnYWx0X3R5cGUnXSAhPSAnU2Nob29sIERpc3RyaWN0J1xyXG4gICAgICAgICAgZ3JhcGggPSB0cnVlXHJcbiAgICAgICAgICBjb25zb2xlLmxvZyAnIyMjYWwnK0pTT04uc3RyaW5naWZ5IGRhdGFcclxuICAgICAgICAgIGlmIGRhdGFbJ3RvdGFsX3JldmVudWVfcGVyX2NhcGl0YSddID09IDBcclxuICAgICAgICAgICAgZ3JhcGggPSBmYWxzZVxyXG4gICAgICAgICAgZHJhd0NoYXJ0ID0gKCkgLT5cclxuICAgICAgICAgICAgc2V0VGltZW91dCAoIC0+XHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uRGF0YVRhYmxlKClcclxuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRDb2x1bW4gJ3N0cmluZycsICdQZXIgQ2FwaXRhJ1xyXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnbnVtYmVyJywgJ1Jldi4nXHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkUm93cyBbXHJcbiAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICdUb3RhbCBSZXZlbnVlIFxcbiBQZXIgQ2FwaXRhJ1xyXG4gICAgICAgICAgICAgICAgICBkYXRhWyd0b3RhbF9yZXZlbnVlX3Blcl9jYXBpdGEnXVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICAnTWVkaWFuIFRvdGFsIFxcbiBSZXZlbnVlIFBlciBcXG4gQ2FwaXRhIEZvciBBbGwgQ2l0aWVzJ1xyXG4gICAgICAgICAgICAgICAgICA0MjBcclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgb3B0aW9ucyA9XHJcbiAgICAgICAgICAgICAgICAndGl0bGUnOidUb3RhbCBSZXZlbnVlJ1xyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogNDcwXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogMzAwXHJcbiAgICAgICAgICAgICAgICAnaXNTdGFja2VkJzogJ3RydWUnXHJcbiAgICAgICAgICAgICAgICAnY29sb3JzJzogWycjMDA1Y2U2JywgJyMwMDk5MzMnXVxyXG4gICAgICAgICAgICAgICAgJ2NoYXJ0QXJlYS53aWR0aCc6ICcxMDAlJ1xyXG4gICAgICAgICAgICAgIGNoYXJ0ID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLkNvbHVtbkNoYXJ0IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICdmaW4taGVhbHRoLXJldmVudWUtZ3JhcGgnXHJcbiAgICAgICAgICAgICAgY2hhcnQuZHJhdyB2aXNfZGF0YSwgb3B0aW9uc1xyXG4gICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICApLCAxMDAwXHJcbiAgICAgICAgICBpZiBncmFwaFxyXG4gICAgICAgICAgICBnb29nbGUubG9hZCAndmlzdWFsaXphdGlvbicsICcxLjAnLFxyXG4gICAgICAgICAgICAnY2FsbGJhY2snIDogZHJhd0NoYXJ0KClcclxuICAgICAgICAgICAgJ3BhY2thZ2VzJyA6J2NvcmVjaGFydCdcclxuICAgICAgICAgIHBsb3RfaGFuZGxlc1snZmluLWhlYWx0aC1yZXZlbnVlLWdyYXBoJ10gPSdmaW4taGVhbHRoLXJldmVudWUtZ3JhcGgnXHJcbiAgICAgICAgI2Zpbi1oZWFsdGgtZXhwZW5kaXR1cmVzLWdyYXBoXHJcbiAgICAgICAgaWYgbm90IHBsb3RfaGFuZGxlc1snZmluLWhlYWx0aC1leHBlbmRpdHVyZXMtZ3JhcGgnXSBhbmQgZGF0YVsnYWx0X3R5cGUnXSAhPSAnU2Nob29sIERpc3RyaWN0J1xyXG4gICAgICAgICAgZ3JhcGggPSB0cnVlXHJcbiAgICAgICAgICBpZiBkYXRhWyd0b3RhbF9leHBlbmRpdHVyZXNfcGVyX2NhcGl0YSddID09IDBcclxuICAgICAgICAgICAgZ3JhcGggPSBmYWxzZVxyXG4gICAgICAgICAgZHJhd0NoYXJ0ID0gKCkgLT5cclxuICAgICAgICAgICAgc2V0VGltZW91dCAoIC0+XHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uRGF0YVRhYmxlKClcclxuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRDb2x1bW4gJ3N0cmluZycsICdQZXIgQ2FwaXRhJ1xyXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnbnVtYmVyJywgJ0V4cC4nXHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkUm93cyBbXHJcbiAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICdUb3RhbCBFeHBlbmRpdHVyZXMgXFxuIFBlciBDYXBpdGEnXHJcbiAgICAgICAgICAgICAgICAgIGRhdGFbJ3RvdGFsX2V4cGVuZGl0dXJlc19wZXJfY2FwaXRhJ11cclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgJ01lZGlhbiBUb3RhbCBcXG4gRXhwZW5kaXR1cmVzIFxcbiBQZXIgQ2FwaXRhIFxcbiBGb3IgQWxsIENpdGllcydcclxuICAgICAgICAgICAgICAgICAgNDIwXHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgIG9wdGlvbnMgPVxyXG4gICAgICAgICAgICAgICAgJ3RpdGxlJzonVG90YWwgRXhwZW5kaXR1cmVzJ1xyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogNDcwXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogMzAwXHJcbiAgICAgICAgICAgICAgICAnaXNTdGFja2VkJzogJ3RydWUnXHJcbiAgICAgICAgICAgICAgICAnY29sb3JzJzogWycjMDA1Y2U2JywgJyMwMDk5MzMnXVxyXG4gICAgICAgICAgICAgICAgJ2NoYXJ0QXJlYS53aWR0aCc6ICcxMDAlJ1xyXG4gICAgICAgICAgICAgIGlmIGdyYXBoXHJcbiAgICAgICAgICAgICAgICBjaGFydCA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5Db2x1bW5DaGFydCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAnZmluLWhlYWx0aC1leHBlbmRpdHVyZXMtZ3JhcGgnXHJcbiAgICAgICAgICAgICAgICBjaGFydC5kcmF3IHZpc19kYXRhLCBvcHRpb25zXHJcbiAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgICksIDEwMDBcclxuICAgICAgICAgIGdvb2dsZS5sb2FkICd2aXN1YWxpemF0aW9uJywgJzEuMCcsXHJcbiAgICAgICAgICAnY2FsbGJhY2snIDogZHJhd0NoYXJ0KClcclxuICAgICAgICAgICdwYWNrYWdlcycgOidjb3JlY2hhcnQnXHJcbiAgICAgICAgICBwbG90X2hhbmRsZXNbJ2Zpbi1oZWFsdGgtZXhwZW5kaXR1cmVzLWdyYXBoJ10gPSdmaW4taGVhbHRoLWV4cGVuZGl0dXJlcy1ncmFwaCdcclxuICAgICAgd2hlbiAnRmluYW5jaWFsIFN0YXRlbWVudHMnXHJcbiAgICAgICAgaWYgZGF0YS5maW5hbmNpYWxfc3RhdGVtZW50c1xyXG4gICAgICAgICAgaCA9ICcnXHJcbiAgICAgICAgICAjaCArPSByZW5kZXJfZmllbGRzIHRhYi5maWVsZHMsIGRhdGEsIHRlbXBsYXRlc1sndGFiZGV0YWlsLW5hbWV2YWx1ZS10ZW1wbGF0ZSddXHJcbiAgICAgICAgICBoICs9IHJlbmRlcl9maW5hbmNpYWxfZmllbGRzIGRhdGEuZmluYW5jaWFsX3N0YXRlbWVudHMsIHRlbXBsYXRlc1sndGFiZGV0YWlsLWZpbnN0YXRlbWVudC10ZW1wbGF0ZSddXHJcbiAgICAgICAgICBkZXRhaWxfZGF0YS50YWJjb250ZW50ICs9IHRlbXBsYXRlc1sndGFiZGV0YWlsLWZpbmFuY2lhbC1zdGF0ZW1lbnRzLXRlbXBsYXRlJ10oY29udGVudDogaClcclxuICAgICAgICAgICN0YWJkZXRhaWwtZmluYW5jaWFsLXN0YXRlbWVudHMtdGVtcGxhdGVcclxuICAgICAgICAgIGlmIG5vdCBwbG90X2hhbmRsZXNbJ3RvdGFsLXJldmVudWUtcGllJ11cclxuICAgICAgICAgICAgZ3JhcGggPSB0cnVlXHJcbiAgICAgICAgICAgIGlmIGRhdGEuZmluYW5jaWFsX3N0YXRlbWVudHMubGVuZ3RoID09IDBcclxuICAgICAgICAgICAgICBncmFwaCA9IGZhbHNlXHJcbiAgICAgICAgICAgIGRyYXdDaGFydCA9ICgpIC0+XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQgKCAtPlxyXG4gICAgICAgICAgICAgIHZpc19kYXRhID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLkRhdGFUYWJsZSgpXHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdzdHJpbmcnLCAnVG90YWwgR292LiBFeHBlbmRpdHVyZXMnXHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdudW1iZXInLCAnVG90YWwnXHJcblxyXG4gICAgICAgICAgICAgIHJvd3MgPSBbXVxyXG4gICAgICAgICAgICAgIGZvciBpdGVtIGluIGRhdGEuZmluYW5jaWFsX3N0YXRlbWVudHNcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nICdAQEBAJytKU09OLnN0cmluZ2lmeSBpdGVtXHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbS5jYXRlZ29yeV9uYW1lIGlzIFwiUmV2ZW51ZXNcIikgYW5kIChpdGVtLmNhcHRpb24gaXNudCBcIlRvdGFsIFJldmVudWVzXCIpXHJcblxyXG4gICAgICAgICAgICAgICAgICByID0gW1xyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uY2FwdGlvblxyXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlSW50IGl0ZW0udG90YWxmdW5kc1xyXG4gICAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgICAgIHJvd3MucHVzaChyKVxyXG5cclxuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRSb3dzIHJvd3NcclxuICAgICAgICAgICAgICBvcHRpb25zID1cclxuICAgICAgICAgICAgICAgICd0aXRsZSc6J1RvdGFsIFJldmVudWVzJ1xyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogNDAwXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogMzUwXHJcbiAgICAgICAgICAgICAgICAncGllU3RhcnRBbmdsZSc6IDYwXHJcbiAgICAgICAgICAgICAgICAnc2xpY2VWaXNpYmlsaXR5VGhyZXNob2xkJzogLjA1XHJcbiAgICAgICAgICAgICAgICAnZm9yY2VJRnJhbWUnOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAnY2hhcnRBcmVhJzp7XHJcbiAgICAgICAgICAgICAgICAgICB3aWR0aDonOTAlJ1xyXG4gICAgICAgICAgICAgICAgICAgaGVpZ2h0Oic3NSUnXHJcbiAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgIydpczNEJyA6ICd0cnVlJ1xyXG4gICAgICAgICAgICAgIGlmIGdyYXBoXHJcbiAgICAgICAgICAgICAgICBjaGFydCA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5QaWVDaGFydCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAndG90YWwtcmV2ZW51ZS1waWUnXHJcbiAgICAgICAgICAgICAgICBjaGFydC5kcmF3IHZpc19kYXRhLCBvcHRpb25zXHJcbiAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgICksIDEwMDBcclxuICAgICAgICAgIGlmIGdyYXBoXHJcbiAgICAgICAgICAgIGdvb2dsZS5sb2FkICd2aXN1YWxpemF0aW9uJywgJzEuMCcsXHJcbiAgICAgICAgICAgICdjYWxsYmFjaycgOiBkcmF3Q2hhcnQoKVxyXG4gICAgICAgICAgICAncGFja2FnZXMnIDonY29yZWNoYXJ0J1xyXG4gICAgICAgICAgcGxvdF9oYW5kbGVzWyd0b3RhbC1yZXZlbnVlLXBpZSddID0ndG90YWwtcmV2ZW51ZS1waWUnXHJcbiAgICAgICAgICBpZiBub3QgcGxvdF9oYW5kbGVzWyd0b3RhbC1leHBlbmRpdHVyZXMtcGllJ11cclxuICAgICAgICAgICAgZ3JhcGggPSB0cnVlXHJcbiAgICAgICAgICAgIGlmIGRhdGEuZmluYW5jaWFsX3N0YXRlbWVudHMubGVuZ3RoID09IDBcclxuICAgICAgICAgICAgICBncmFwaCA9IGZhbHNlXHJcbiAgICAgICAgICAgIGRyYXdDaGFydCA9ICgpIC0+XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQgKCAtPlxyXG4gICAgICAgICAgICAgIHZpc19kYXRhID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLkRhdGFUYWJsZSgpXHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdzdHJpbmcnLCAnVG90YWwgR292LiBFeHBlbmRpdHVyZXMnXHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdudW1iZXInLCAnVG90YWwnXHJcblxyXG4gICAgICAgICAgICAgIHJvd3MgPSBbXVxyXG4gICAgICAgICAgICAgIGZvciBpdGVtIGluIGRhdGEuZmluYW5jaWFsX3N0YXRlbWVudHNcclxuICAgICAgICAgICAgICAgIGlmIChpdGVtLmNhdGVnb3J5X25hbWUgaXMgXCJFeHBlbmRpdHVyZXNcIikgYW5kIChpdGVtLmNhcHRpb24gaXNudCBcIlRvdGFsIEV4cGVuZGl0dXJlc1wiKVxyXG5cclxuICAgICAgICAgICAgICAgICAgciA9IFtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLmNhcHRpb25cclxuICAgICAgICAgICAgICAgICAgICBwYXJzZUludCBpdGVtLnRvdGFsZnVuZHNcclxuICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgICByb3dzLnB1c2gocilcclxuXHJcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkUm93cyByb3dzXHJcbiAgICAgICAgICAgICAgb3B0aW9ucyA9XHJcbiAgICAgICAgICAgICAgICAndGl0bGUnOidUb3RhbCBFeHBlbmRpdHVyZXMnXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiA0MDBcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAzNTBcclxuICAgICAgICAgICAgICAgICdwaWVTdGFydEFuZ2xlJzogNjBcclxuICAgICAgICAgICAgICAgICdzbGljZVZpc2liaWxpdHlUaHJlc2hvbGQnOiAuMDVcclxuICAgICAgICAgICAgICAgICdmb3JjZUlGcmFtZSc6IHRydWVcclxuICAgICAgICAgICAgICAgICdjaGFydEFyZWEnOntcclxuICAgICAgICAgICAgICAgICAgIHdpZHRoOic5MCUnXHJcbiAgICAgICAgICAgICAgICAgICBoZWlnaHQ6Jzc1JSdcclxuICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAjJ2lzM0QnIDogJ3RydWUnXHJcbiAgICAgICAgICAgICAgaWYgZ3JhcGhcclxuICAgICAgICAgICAgICAgIGNoYXJ0ID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLlBpZUNoYXJ0IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICd0b3RhbC1leHBlbmRpdHVyZXMtcGllJ1xyXG4gICAgICAgICAgICAgICAgY2hhcnQuZHJhdyB2aXNfZGF0YSwgb3B0aW9uc1xyXG4gICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICApLCAxMDAwXHJcbiAgICAgICAgICBpZiBncmFwaFxyXG4gICAgICAgICAgICBnb29nbGUubG9hZCAndmlzdWFsaXphdGlvbicsICcxLjAnLFxyXG4gICAgICAgICAgICAnY2FsbGJhY2snIDogZHJhd0NoYXJ0KClcclxuICAgICAgICAgICAgJ3BhY2thZ2VzJyA6J2NvcmVjaGFydCdcclxuICAgICAgICAgIHBsb3RfaGFuZGxlc1sndG90YWwtZXhwZW5kaXR1cmVzLXBpZSddID0ndG90YWwtZXhwZW5kaXR1cmVzLXBpZSdcclxuICAgICAgZWxzZVxyXG4gICAgICAgIGRldGFpbF9kYXRhLnRhYmNvbnRlbnQgKz0gcmVuZGVyX2ZpZWxkcyB0YWIuZmllbGRzLCBkYXRhLCB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC1uYW1ldmFsdWUtdGVtcGxhdGUnXVxyXG5cclxuICAgIGxheW91dF9kYXRhLnRhYmNvbnRlbnQgKz0gdGVtcGxhdGVzWyd0YWJkZXRhaWwtdGVtcGxhdGUnXShkZXRhaWxfZGF0YSlcclxuICByZXR1cm4gdGVtcGxhdGVzWyd0YWJwYW5lbC10ZW1wbGF0ZSddKGxheW91dF9kYXRhKVxyXG5cclxuXHJcbmdldF9sYXlvdXRfZmllbGRzID0gKGxhKSAtPlxyXG4gIGYgPSB7fVxyXG4gIGZvciB0IGluIGxhXHJcbiAgICBmb3IgZmllbGQgaW4gdC5maWVsZHNcclxuICAgICAgZltmaWVsZF0gPSAxXHJcbiAgcmV0dXJuIGZcclxuXHJcbmdldF9yZWNvcmRfZmllbGRzID0gKHIpIC0+XHJcbiAgZiA9IHt9XHJcbiAgZm9yIGZpZWxkX25hbWUgb2YgclxyXG4gICAgZltmaWVsZF9uYW1lXSA9IDFcclxuICByZXR1cm4gZlxyXG5cclxuZ2V0X3VubWVudGlvbmVkX2ZpZWxkcyA9IChsYSwgcikgLT5cclxuICBsYXlvdXRfZmllbGRzID0gZ2V0X2xheW91dF9maWVsZHMgbGFcclxuICByZWNvcmRfZmllbGRzID0gZ2V0X3JlY29yZF9maWVsZHMgclxyXG4gIHVubWVudGlvbmVkX2ZpZWxkcyA9IFtdXHJcbiAgdW5tZW50aW9uZWRfZmllbGRzLnB1c2goZikgZm9yIGYgb2YgcmVjb3JkX2ZpZWxkcyB3aGVuIG5vdCBsYXlvdXRfZmllbGRzW2ZdXHJcbiAgcmV0dXJuIHVubWVudGlvbmVkX2ZpZWxkc1xyXG5cclxuXHJcbmFkZF9vdGhlcl90YWJfdG9fbGF5b3V0ID0gKGxheW91dD1bXSwgZGF0YSkgLT5cclxuICAjY2xvbmUgdGhlIGxheW91dFxyXG4gIGwgPSAkLmV4dGVuZCB0cnVlLCBbXSwgbGF5b3V0XHJcbiAgdCA9XHJcbiAgICBuYW1lOiBcIk90aGVyXCJcclxuICAgIGZpZWxkczogZ2V0X3VubWVudGlvbmVkX2ZpZWxkcyBsLCBkYXRhXHJcblxyXG4gIGwucHVzaCB0XHJcbiAgcmV0dXJuIGxcclxuXHJcblxyXG4jIGNvbnZlcnRzIHRhYiB0ZW1wbGF0ZSBkZXNjcmliZWQgaW4gZ29vZ2xlIGZ1c2lvbiB0YWJsZSB0b1xyXG4jIHRhYiB0ZW1wbGF0ZVxyXG5jb252ZXJ0X2Z1c2lvbl90ZW1wbGF0ZT0odGVtcGwpIC0+XHJcbiAgdGFiX2hhc2g9e31cclxuICB0YWJzPVtdXHJcbiAgIyByZXR1cm5zIGhhc2ggb2YgZmllbGQgbmFtZXMgYW5kIHRoZWlyIHBvc2l0aW9ucyBpbiBhcnJheSBvZiBmaWVsZCBuYW1lc1xyXG4gIGdldF9jb2xfaGFzaCA9IChjb2x1bW5zKSAtPlxyXG4gICAgY29sX2hhc2ggPXt9XHJcbiAgICBjb2xfaGFzaFtjb2xfbmFtZV09aSBmb3IgY29sX25hbWUsaSBpbiB0ZW1wbC5jb2x1bW5zXHJcbiAgICByZXR1cm4gY29sX2hhc2hcclxuXHJcbiAgIyByZXR1cm5zIGZpZWxkIHZhbHVlIGJ5IGl0cyBuYW1lLCBhcnJheSBvZiBmaWVsZHMsIGFuZCBoYXNoIG9mIGZpZWxkc1xyXG4gIHZhbCA9IChmaWVsZF9uYW1lLCBmaWVsZHMsIGNvbF9oYXNoKSAtPlxyXG4gICAgZmllbGRzW2NvbF9oYXNoW2ZpZWxkX25hbWVdXVxyXG5cclxuICAjIGNvbnZlcnRzIGhhc2ggdG8gYW4gYXJyYXkgdGVtcGxhdGVcclxuICBoYXNoX3RvX2FycmF5ID0oaGFzaCkgLT5cclxuICAgIGEgPSBbXVxyXG4gICAgZm9yIGsgb2YgaGFzaFxyXG4gICAgICB0YWIgPSB7fVxyXG4gICAgICB0YWIubmFtZT1rXHJcbiAgICAgIHRhYi5maWVsZHM9aGFzaFtrXVxyXG4gICAgICBhLnB1c2ggdGFiXHJcbiAgICByZXR1cm4gYVxyXG5cclxuXHJcbiAgY29sX2hhc2ggPSBnZXRfY29sX2hhc2godGVtcGwuY29sX2hhc2gpXHJcbiAgcGxhY2Vob2xkZXJfY291bnQgPSAwXHJcblxyXG4gIGZvciByb3csaSBpbiB0ZW1wbC5yb3dzXHJcbiAgICBjYXRlZ29yeSA9IHZhbCAnZ2VuZXJhbF9jYXRlZ29yeScsIHJvdywgY29sX2hhc2hcclxuICAgICN0YWJfaGFzaFtjYXRlZ29yeV09W10gdW5sZXNzIHRhYl9oYXNoW2NhdGVnb3J5XVxyXG4gICAgZmllbGRuYW1lID0gdmFsICdmaWVsZF9uYW1lJywgcm93LCBjb2xfaGFzaFxyXG4gICAgaWYgbm90IGZpZWxkbmFtZSB0aGVuIGZpZWxkbmFtZSA9IFwiX1wiICsgU3RyaW5nICsrcGxhY2Vob2xkZXJfY291bnRcclxuICAgIGZpZWxkTmFtZXNbdmFsICdmaWVsZF9uYW1lJywgcm93LCBjb2xfaGFzaF09dmFsICdkZXNjcmlwdGlvbicsIHJvdywgY29sX2hhc2hcclxuICAgIGZpZWxkTmFtZXNIZWxwW2ZpZWxkbmFtZV0gPSB2YWwgJ2hlbHBfdGV4dCcsIHJvdywgY29sX2hhc2hcclxuICAgIGlmIGNhdGVnb3J5XHJcbiAgICAgIHRhYl9oYXNoW2NhdGVnb3J5XT89W11cclxuICAgICAgdGFiX2hhc2hbY2F0ZWdvcnldLnB1c2ggbjogdmFsKCduJywgcm93LCBjb2xfaGFzaCksIG5hbWU6IGZpZWxkbmFtZSwgbWFzazogdmFsKCdtYXNrJywgcm93LCBjb2xfaGFzaClcclxuXHJcbiAgY2F0ZWdvcmllcyA9IE9iamVjdC5rZXlzKHRhYl9oYXNoKVxyXG4gIGNhdGVnb3JpZXNfc29ydCA9IHt9XHJcbiAgZm9yIGNhdGVnb3J5IGluIGNhdGVnb3JpZXNcclxuICAgIGlmIG5vdCBjYXRlZ29yaWVzX3NvcnRbY2F0ZWdvcnldXHJcbiAgICAgIGNhdGVnb3JpZXNfc29ydFtjYXRlZ29yeV0gPSB0YWJfaGFzaFtjYXRlZ29yeV1bMF0ublxyXG4gICAgZmllbGRzID0gW11cclxuICAgIGZvciBvYmogaW4gdGFiX2hhc2hbY2F0ZWdvcnldXHJcbiAgICAgIGZpZWxkcy5wdXNoIG9ialxyXG4gICAgZmllbGRzLnNvcnQgKGEsYikgLT5cclxuICAgICAgcmV0dXJuIGEubiAtIGIublxyXG4gICAgdGFiX2hhc2hbY2F0ZWdvcnldID0gZmllbGRzXHJcblxyXG4gIGNhdGVnb3JpZXNfYXJyYXkgPSBbXVxyXG4gIGZvciBjYXRlZ29yeSwgbiBvZiBjYXRlZ29yaWVzX3NvcnRcclxuICAgIGNhdGVnb3JpZXNfYXJyYXkucHVzaCBjYXRlZ29yeTogY2F0ZWdvcnksIG46IG5cclxuICBjYXRlZ29yaWVzX2FycmF5LnNvcnQgKGEsYikgLT5cclxuICAgIHJldHVybiBhLm4gLSBiLm5cclxuXHJcbiAgdGFiX25ld2hhc2ggPSB7fVxyXG4gIGZvciBjYXRlZ29yeSBpbiBjYXRlZ29yaWVzX2FycmF5XHJcbiAgICB0YWJfbmV3aGFzaFtjYXRlZ29yeS5jYXRlZ29yeV0gPSB0YWJfaGFzaFtjYXRlZ29yeS5jYXRlZ29yeV1cclxuXHJcbiAgdGFicyA9IGhhc2hfdG9fYXJyYXkodGFiX25ld2hhc2gpXHJcbiAgcmV0dXJuIHRhYnNcclxuXHJcblxyXG5jbGFzcyBUZW1wbGF0ZXMyXHJcblxyXG4gIEBsaXN0ID0gdW5kZWZpbmVkXHJcbiAgQHRlbXBsYXRlcyA9IHVuZGVmaW5lZFxyXG4gIEBkYXRhID0gdW5kZWZpbmVkXHJcbiAgQGV2ZW50cyA9IHVuZGVmaW5lZFxyXG5cclxuICBjb25zdHJ1Y3RvcjooKSAtPlxyXG4gICAgQGxpc3QgPSBbXVxyXG4gICAgQGV2ZW50cyA9IHt9XHJcbiAgICB0ZW1wbGF0ZUxpc3QgPSBbJ3RhYnBhbmVsLXRlbXBsYXRlJywgJ3RhYmRldGFpbC10ZW1wbGF0ZScsICd0YWJkZXRhaWwtbmFtZXZhbHVlLXRlbXBsYXRlJywgJ3RhYmRldGFpbC1maW5zdGF0ZW1lbnQtdGVtcGxhdGUnLCAndGFiZGV0YWlsLW9mZmljaWFsLXRlbXBsYXRlJywgJ3RhYmRldGFpbC1lbXBsb3llZS1jb21wLXRlbXBsYXRlJywgJ3RhYmRldGFpbC1maW5hbmNpYWwtaGVhbHRoLXRlbXBsYXRlJywgJ3RhYmRldGFpbC1maW5hbmNpYWwtc3RhdGVtZW50cy10ZW1wbGF0ZSddXHJcbiAgICB0ZW1wbGF0ZVBhcnRpYWxzID0gWyd0YWItdGVtcGxhdGUnXVxyXG4gICAgQHRlbXBsYXRlcyA9IHt9XHJcbiAgICBmb3IgdGVtcGxhdGUsaSBpbiB0ZW1wbGF0ZUxpc3RcclxuICAgICAgQHRlbXBsYXRlc1t0ZW1wbGF0ZV0gPSBIYW5kbGViYXJzLmNvbXBpbGUoJCgnIycgKyB0ZW1wbGF0ZSkuaHRtbCgpKVxyXG4gICAgZm9yIHRlbXBsYXRlLGkgaW4gdGVtcGxhdGVQYXJ0aWFsc1xyXG4gICAgICBIYW5kbGViYXJzLnJlZ2lzdGVyUGFydGlhbCh0ZW1wbGF0ZSwgJCgnIycgKyB0ZW1wbGF0ZSkuaHRtbCgpKVxyXG5cclxuICBhZGRfdGVtcGxhdGU6IChsYXlvdXRfbmFtZSwgbGF5b3V0X2pzb24pIC0+XHJcbiAgICBAbGlzdC5wdXNoXHJcbiAgICAgIHBhcmVudDp0aGlzXHJcbiAgICAgIG5hbWU6bGF5b3V0X25hbWVcclxuICAgICAgcmVuZGVyOihkYXQpIC0+XHJcbiAgICAgICAgQHBhcmVudC5kYXRhID0gZGF0XHJcbiAgICAgICAgcmVuZGVyX3RhYnMobGF5b3V0X2pzb24sIGRhdCwgdGhpcywgQHBhcmVudClcclxuICAgICAgYmluZDogKHRwbF9uYW1lLCBjYWxsYmFjaykgLT5cclxuICAgICAgICBpZiBub3QgQHBhcmVudC5ldmVudHNbdHBsX25hbWVdXHJcbiAgICAgICAgICBAcGFyZW50LmV2ZW50c1t0cGxfbmFtZV0gPSBbY2FsbGJhY2tdXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgQHBhcmVudC5ldmVudHNbdHBsX25hbWVdLnB1c2ggY2FsbGJhY2tcclxuICAgICAgYWN0aXZhdGU6ICh0cGxfbmFtZSkgLT5cclxuICAgICAgICBpZiBAcGFyZW50LmV2ZW50c1t0cGxfbmFtZV1cclxuICAgICAgICAgIGZvciBlLGkgaW4gQHBhcmVudC5ldmVudHNbdHBsX25hbWVdXHJcbiAgICAgICAgICAgIGUgdHBsX25hbWUsIEBwYXJlbnQuZGF0YVxyXG5cclxuICBsb2FkX3RlbXBsYXRlOih0ZW1wbGF0ZV9uYW1lLCB1cmwpIC0+XHJcbiAgICAkLmFqYXhcclxuICAgICAgdXJsOiB1cmxcclxuICAgICAgZGF0YVR5cGU6ICdqc29uJ1xyXG4gICAgICBjYWNoZTogdHJ1ZVxyXG4gICAgICBzdWNjZXNzOiAodGVtcGxhdGVfanNvbikgPT5cclxuICAgICAgICBAYWRkX3RlbXBsYXRlKHRlbXBsYXRlX25hbWUsIHRlbXBsYXRlX2pzb24pXHJcbiAgICAgICAgcmV0dXJuXHJcblxyXG4gIGxvYWRfZnVzaW9uX3RlbXBsYXRlOih0ZW1wbGF0ZV9uYW1lLCB1cmwpIC0+XHJcbiAgICAkLmFqYXhcclxuICAgICAgdXJsOiB1cmxcclxuICAgICAgZGF0YVR5cGU6ICdqc29uJ1xyXG4gICAgICBjYWNoZTogdHJ1ZVxyXG4gICAgICBzdWNjZXNzOiAodGVtcGxhdGVfanNvbikgPT5cclxuICAgICAgICB0ID0gY29udmVydF9mdXNpb25fdGVtcGxhdGUgdGVtcGxhdGVfanNvblxyXG4gICAgICAgIEBhZGRfdGVtcGxhdGUodGVtcGxhdGVfbmFtZSwgdClcclxuICAgICAgICByZXR1cm5cclxuXHJcblxyXG4gIGdldF9uYW1lczogLT5cclxuICAgICh0Lm5hbWUgZm9yIHQgaW4gQGxpc3QpXHJcblxyXG4gIGdldF9pbmRleF9ieV9uYW1lOiAobmFtZSkgLT5cclxuICAgIGZvciB0LGkgaW4gQGxpc3RcclxuICAgICAgaWYgdC5uYW1lIGlzIG5hbWVcclxuICAgICAgICByZXR1cm4gaVxyXG4gICAgIHJldHVybiAtMVxyXG5cclxuICBnZXRfaHRtbDogKGluZCwgZGF0YSkgLT5cclxuICAgIGlmIChpbmQgaXMgLTEpIHRoZW4gcmV0dXJuICBcIlwiXHJcblxyXG4gICAgaWYgQGxpc3RbaW5kXVxyXG4gICAgICByZXR1cm4gQGxpc3RbaW5kXS5yZW5kZXIoZGF0YSlcclxuICAgIGVsc2VcclxuICAgICAgcmV0dXJuIFwiXCJcclxuXHJcbiAgYWN0aXZhdGU6IChpbmQsIHRwbF9uYW1lKSAtPlxyXG4gICAgaWYgQGxpc3RbaW5kXVxyXG4gICAgICBAbGlzdFtpbmRdLmFjdGl2YXRlIHRwbF9uYW1lXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRlbXBsYXRlczJcclxuIl19
