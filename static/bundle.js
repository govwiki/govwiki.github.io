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
      console.log('123');
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL2hvbWUvdm9yb25vdi9kZXYvZ292d2lraS51cy9jb2ZmZWUvZ292bWFwLmNvZmZlZSIsIi9ob21lL3Zvcm9ub3YvZGV2L2dvdndpa2kudXMvY29mZmVlL2dvdnNlbGVjdG9yLmNvZmZlZSIsIi9ob21lL3Zvcm9ub3YvZGV2L2dvdndpa2kudXMvY29mZmVlL21haW4uY29mZmVlIiwiL2hvbWUvdm9yb25vdi9kZXYvZ292d2lraS51cy9jb2ZmZWUvcXVlcnltYXRjaGVyLmNvZmZlZSIsIi9ob21lL3Zvcm9ub3YvZGV2L2dvdndpa2kudXMvY29mZmVlL3RlbXBsYXRlczIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSw0TEFBQTtFQUFBOztBQUFBLGNBQUEsR0FBZTs7QUFHZixHQUFBLEdBQVUsSUFBQSxLQUFBLENBQ1I7RUFBQSxFQUFBLEVBQUksU0FBSjtFQUNBLEdBQUEsRUFBSyxFQURMO0VBRUEsR0FBQSxFQUFLLENBQUMsR0FGTjtFQUdBLElBQUEsRUFBTSxDQUhOO0VBSUEsV0FBQSxFQUFhLEtBSmI7RUFLQSxVQUFBLEVBQVksS0FMWjtFQU1BLFdBQUEsRUFBYSxJQU5iO0VBT0Esa0JBQUEsRUFDRTtJQUFBLEtBQUEsRUFBTyxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQXBDO0dBUkY7RUFTQSxjQUFBLEVBQWdCLFNBQUE7V0FDZCx1QkFBQSxDQUF3QixHQUF4QjtFQURjLENBVGhCO0NBRFE7O0FBYVYsR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFTLENBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsU0FBNUIsQ0FBc0MsQ0FBQyxJQUF4RCxDQUE2RCxRQUFRLENBQUMsY0FBVCxDQUF3QixRQUF4QixDQUE3RDs7QUFFQSxDQUFBLENB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QkFBQSxDQUF3QixhQUF4QjtVQUNKLEtBQUMsQ0FBQSxZQUFELENBQWMsYUFBZCxFQUE2QixDQUE3QjtRQUZPO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUhUO0tBREY7RUFEbUI7O3VCQVdyQixTQUFBLEdBQVcsU0FBQTtBQUNULFFBQUE7QUFBQztBQUFBO1NBQUEscUNBQUE7O21CQUFBLENBQUMsQ0FBQztBQUFGOztFQURROzt1QkFHWCxpQkFBQSxHQUFtQixTQUFDLElBQUQ7QUFDakIsUUFBQTtBQUFBO0FBQUEsU0FBQSw2Q0FBQTs7TUFDRSxJQUFHLENBQUMsQ0FBQyxJQUFGLEtBQVUsSUFBYjtBQUNFLGVBQU8sRUFEVDs7QUFERjtBQUdDLFdBQU8sQ0FBQztFQUpROzt1QkFNbkIsUUFBQSxHQUFVLFNBQUMsR0FBRCxFQUFNLElBQU47SUFDUixJQUFJLEdBQUEsS0FBTyxDQUFDLENBQVo7QUFBb0IsYUFBUSxHQUE1Qjs7SUFFQSxJQUFHLElBQUMsQ0FBQSxJQUFLLENBQUEsR0FBQSxDQUFUO0FBQ0UsYUFBTyxJQUFDLENBQUEsSUFBSyxDQUFBLEdBQUEsQ0FBSSxDQUFDLE1BQVgsQ0FBa0IsSUFBbEIsRUFEVDtLQUFBLE1BQUE7QUFHRSxhQUFPLEdBSFQ7O0VBSFE7O3VCQVFWLFFBQUEsR0FBVSxTQUFDLEdBQUQsRUFBTSxRQUFOO0lBQ1IsSUFBRyxJQUFDLENBQUEsSUFBSyxDQUFBLEdBQUEsQ0FBVDthQUNFLElBQUMsQ0FBQSxJQUFLLENBQUEsR0FBQSxDQUFJLENBQUMsUUFBWCxDQUFvQixRQUFwQixFQURGOztFQURROzs7Ozs7QUFJWixNQUFNLENBQUMsT0FBUCxHQUFpQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJib3VuZHNfdGltZW91dD11bmRlZmluZWRcblxuXG5tYXAgPSBuZXcgR01hcHNcbiAgZWw6ICcjZ292bWFwJ1xuICBsYXQ6IDM3XG4gIGxuZzogLTExOVxuICB6b29tOiA2XG4gIHNjcm9sbHdoZWVsOiBmYWxzZVxuICBwYW5Db250cm9sOiBmYWxzZVxuICB6b29tQ29udHJvbDogdHJ1ZVxuICB6b29tQ29udHJvbE9wdGlvbnM6XG4gICAgc3R5bGU6IGdvb2dsZS5tYXBzLlpvb21Db250cm9sU3R5bGUuU01BTExcbiAgYm91bmRzX2NoYW5nZWQ6IC0+XG4gICAgb25fYm91bmRzX2NoYW5nZWRfbGF0ZXIgMjAwXG5cbm1hcC5tYXAuY29udHJvbHNbZ29vZ2xlLm1hcHMuQ29udHJvbFBvc2l0aW9uLlJJR0hUX1RPUF0ucHVzaChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGVnZW5kJykpXG5cbiQgLT5cbiAgJCgnI2xlZ2VuZCBsaScpLm9uICdjbGljaycsIC0+XG4gICAgJCh0aGlzKS50b2dnbGVDbGFzcygnYWN0aXZlJylcbiAgICBoaWRkZW5fZmllbGQgPSAkKHRoaXMpLmZpbmQoJ2lucHV0JylcbiAgICB2YWx1ZSA9IGhpZGRlbl9maWVsZC52YWwoKVxuICAgIGhpZGRlbl9maWVsZC52YWwoaWYgdmFsdWUgPT0gJzEnIHRoZW4gJzAnIGVsc2UgJzEnKVxuICAgIHJlYnVpbGRfZmlsdGVyKClcblxucmVidWlsZF9maWx0ZXIgPSAtPlxuICBoYXJkX3BhcmFtcyA9IFsnQ2l0eScsICdTY2hvb2wgRGlzdHJpY3QnLCAnU3BlY2lhbCBEaXN0cmljdCddXG4gIEdPVldJS0kuZ292X3R5cGVfZmlsdGVyXzIgPSBbXVxuICAkKCcudHlwZV9maWx0ZXInKS5lYWNoIChpbmRleCwgZWxlbWVudCkgLT5cbiAgICBpZiAkKGVsZW1lbnQpLmF0dHIoJ25hbWUnKSBpbiBoYXJkX3BhcmFtcyBhbmQgJChlbGVtZW50KS52YWwoKSA9PSAnMSdcbiAgICAgIEdPVldJS0kuZ292X3R5cGVfZmlsdGVyXzIucHVzaCAkKGVsZW1lbnQpLmF0dHIoJ25hbWUnKVxuICBvbl9ib3VuZHNfY2hhbmdlZF9sYXRlciAzNTBcblxub25fYm91bmRzX2NoYW5nZWRfbGF0ZXIgID0gKG1zZWMpICAtPlxuICBjbGVhclRpbWVvdXQgYm91bmRzX3RpbWVvdXRcbiAgYm91bmRzX3RpbWVvdXQgPSBzZXRUaW1lb3V0IG9uX2JvdW5kc19jaGFuZ2VkLCBtc2VjXG5cbiAgICBcbm9uX2JvdW5kc19jaGFuZ2VkID0oZSkgLT5cbiAgY29uc29sZS5sb2cgXCJib3VuZHNfY2hhbmdlZFwiXG4gIGI9bWFwLmdldEJvdW5kcygpXG4gIHVybF92YWx1ZT1iLnRvVXJsVmFsdWUoKVxuICBuZT1iLmdldE5vcnRoRWFzdCgpXG4gIHN3PWIuZ2V0U291dGhXZXN0KClcbiAgbmVfbGF0PW5lLmxhdCgpXG4gIG5lX2xuZz1uZS5sbmcoKVxuICBzd19sYXQ9c3cubGF0KClcbiAgc3dfbG5nPXN3LmxuZygpXG4gIHN0ID0gR09WV0lLSS5zdGF0ZV9maWx0ZXJcbiAgdHkgPSBHT1ZXSUtJLmdvdl90eXBlX2ZpbHRlclxuICBndGYgPSBHT1ZXSUtJLmdvdl90eXBlX2ZpbHRlcl8yXG5cbiAgIyMjXG4gICMgQnVpbGQgdGhlIHF1ZXJ5LlxuICBxPVwiXCJcIiBcImxhdGl0dWRlXCI6e1wiJGx0XCI6I3tuZV9sYXR9LFwiJGd0XCI6I3tzd19sYXR9fSxcImxvbmdpdHVkZVwiOntcIiRsdFwiOiN7bmVfbG5nfSxcIiRndFwiOiN7c3dfbG5nfX1cIlwiXCJcbiAgIyBBZGQgZmlsdGVycyBpZiB0aGV5IGV4aXN0XG4gIHErPVwiXCJcIixcInN0YXRlXCI6XCIje3N0fVwiIFwiXCJcIiBpZiBzdFxuICBxKz1cIlwiXCIsXCJnb3ZfdHlwZVwiOlwiI3t0eX1cIiBcIlwiXCIgaWYgdHlcblxuXG4gIGdldF9yZWNvcmRzIHEsIDIwMCwgIChkYXRhKSAtPlxuICAgICNjb25zb2xlLmxvZyBcImxlbmd0aD0je2RhdGEubGVuZ3RofVwiXG4gICAgI2NvbnNvbGUubG9nIFwibGF0OiAje25lX2xhdH0sI3tzd19sYXR9IGxuZzogI3tuZV9sbmd9LCAje3N3X2xuZ31cIlxuICAgIG1hcC5yZW1vdmVNYXJrZXJzKClcbiAgICBhZGRfbWFya2VyKHJlYykgZm9yIHJlYyBpbiBkYXRhXG4gICAgcmV0dXJuXG4gICMjI1xuXG4gICMgQnVpbGQgdGhlIHF1ZXJ5IDIuXG4gIHEyPVwiXCJcIiBsYXRpdHVkZTwje25lX2xhdH0gQU5EIGxhdGl0dWRlPiN7c3dfbGF0fSBBTkQgbG9uZ2l0dWRlPCN7bmVfbG5nfSBBTkQgbG9uZ2l0dWRlPiN7c3dfbG5nfSBBTkQgYWx0X3R5cGUhPVwiQ291bnR5XCIgXCJcIlwiXG4gICMgQWRkIGZpbHRlcnMgaWYgdGhleSBleGlzdFxuICBxMis9XCJcIlwiIEFORCBzdGF0ZT1cIiN7c3R9XCIgXCJcIlwiIGlmIHN0XG4gIHEyKz1cIlwiXCIgQU5EIGdvdl90eXBlPVwiI3t0eX1cIiBcIlwiXCIgaWYgdHlcblxuICBpZiBndGYubGVuZ3RoID4gMFxuICAgIGZpcnN0ID0gdHJ1ZVxuICAgIGFkZGl0aW9uYWxfZmlsdGVyID0gXCJcIlwiIEFORCAoXCJcIlwiXG4gICAgZm9yIGdvdl90eXBlIGluIGd0ZlxuICAgICAgaWYgbm90IGZpcnN0XG4gICAgICAgIGFkZGl0aW9uYWxfZmlsdGVyICs9IFwiXCJcIiBPUlwiXCJcIlxuICAgICAgYWRkaXRpb25hbF9maWx0ZXIgKz0gXCJcIlwiIGFsdF90eXBlPVwiI3tnb3ZfdHlwZX1cIiBcIlwiXCJcbiAgICAgIGZpcnN0ID0gZmFsc2VcbiAgICBhZGRpdGlvbmFsX2ZpbHRlciArPSBcIlwiXCIpXCJcIlwiXG5cbiAgICBxMiArPSBhZGRpdGlvbmFsX2ZpbHRlclxuICBlbHNlXG4gICAgcTIgKz0gXCJcIlwiIEFORCBhbHRfdHlwZSE9XCJDaXR5XCIgQU5EIGFsdF90eXBlIT1cIlNjaG9vbCBEaXN0cmljdFwiIEFORCBhbHRfdHlwZSE9XCJTcGVjaWFsIERpc3RyaWN0XCIgXCJcIlwiXG5cbiAgZ2V0X3JlY29yZHMyIHEyLCAyMDAsICAoZGF0YSkgLT5cbiAgICAjY29uc29sZS5sb2cgXCJsZW5ndGg9I3tkYXRhLmxlbmd0aH1cIlxuICAgICNjb25zb2xlLmxvZyBcImxhdDogI3tuZV9sYXR9LCN7c3dfbGF0fSBsbmc6ICN7bmVfbG5nfSwgI3tzd19sbmd9XCJcbiAgICBtYXAucmVtb3ZlTWFya2VycygpXG4gICAgYWRkX21hcmtlcihyZWMpIGZvciByZWMgaW4gZGF0YS5yZWNvcmRcbiAgICByZXR1cm5cblxuZ2V0X2ljb24gPShnb3ZfdHlwZSkgLT5cbiAgXG4gIF9jaXJjbGUgPShjb2xvciktPlxuICAgIHBhdGg6IGdvb2dsZS5tYXBzLlN5bWJvbFBhdGguQ0lSQ0xFXG4gICAgZmlsbE9wYWNpdHk6IDAuNVxuICAgIGZpbGxDb2xvcjpjb2xvclxuICAgIHN0cm9rZVdlaWdodDogMVxuICAgIHN0cm9rZUNvbG9yOid3aGl0ZSdcbiAgICAjc3Ryb2tlUG9zaXRpb246IGdvb2dsZS5tYXBzLlN0cm9rZVBvc2l0aW9uLk9VVFNJREVcbiAgICBzY2FsZTo2XG5cbiAgc3dpdGNoIGdvdl90eXBlXG4gICAgd2hlbiAnR2VuZXJhbCBQdXJwb3NlJyB0aGVuIHJldHVybiBfY2lyY2xlICcjMDNDJ1xuICAgIHdoZW4gJ0NlbWV0ZXJpZXMnICAgICAgdGhlbiByZXR1cm4gX2NpcmNsZSAnIzAwMCdcbiAgICB3aGVuICdIb3NwaXRhbHMnICAgICAgIHRoZW4gcmV0dXJuIF9jaXJjbGUgJyMwQzAnXG4gICAgZWxzZSByZXR1cm4gX2NpcmNsZSAnI0QyMCdcblxuXG5cblxuYWRkX21hcmtlciA9KHJlYyktPlxuICAjY29uc29sZS5sb2cgXCIje3JlYy5yYW5kfSAje3JlYy5pbmNfaWR9ICN7cmVjLnppcH0gI3tyZWMubGF0aXR1ZGV9ICN7cmVjLmxvbmdpdHVkZX0gI3tyZWMuZ292X25hbWV9XCJcbiAgbWFwLmFkZE1hcmtlclxuICAgIGxhdDogcmVjLmxhdGl0dWRlXG4gICAgbG5nOiByZWMubG9uZ2l0dWRlXG4gICAgaWNvbjogZ2V0X2ljb24ocmVjLmdvdl90eXBlKVxuICAgIHRpdGxlOiAgXCIje3JlYy5nb3ZfbmFtZX0sICN7cmVjLmdvdl90eXBlfSAoI3tyZWMubGF0aXR1ZGV9LCAje3JlYy5sb25naXR1ZGV9KVwiXG4gICAgaW5mb1dpbmRvdzpcbiAgICAgIGNvbnRlbnQ6IGNyZWF0ZV9pbmZvX3dpbmRvdyByZWNcbiAgICBjbGljazogKGUpLT5cbiAgICAgICN3aW5kb3cuR09WV0lLSS5zaG93X3JlY29yZCByZWNcbiAgICAgIHdpbmRvdy5HT1ZXSUtJLnNob3dfcmVjb3JkMiByZWNcbiAgXG4gIHJldHVyblxuXG5cbmNyZWF0ZV9pbmZvX3dpbmRvdyA9KHIpIC0+XG4gIHcgPSAkKCc8ZGl2PjwvZGl2PicpXG4gIC5hcHBlbmQgJChcIjxhIGhyZWY9JyMnPjxzdHJvbmc+I3tyLmdvdl9uYW1lfTwvc3Ryb25nPjwvYT5cIikuY2xpY2sgKGUpLT5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zb2xlLmxvZyByXG4gICAgI3dpbmRvdy5HT1ZXSUtJLnNob3dfcmVjb3JkIHJcbiAgICB3aW5kb3cuR09WV0lLSS5zaG93X3JlY29yZDIgclxuXG4gIC5hcHBlbmQgJChcIjxkaXY+ICN7ci5nb3ZfdHlwZX0gICN7ci5jaXR5fSAje3IuemlwfSAje3Iuc3RhdGV9PC9kaXY+XCIpXG4gIHJldHVybiB3WzBdXG5cblxuXG5cbmdldF9yZWNvcmRzID0gKHF1ZXJ5LCBsaW1pdCwgb25zdWNjZXNzKSAtPlxuICAkLmFqYXhcbiAgICB1cmw6IFwiaHR0cHM6Ly9hcGkubW9uZ29sYWIuY29tL2FwaS8xL2RhdGFiYXNlcy9nb3Z3aWtpL2NvbGxlY3Rpb25zL2dvdnMvP3E9eyN7cXVlcnl9fSZmPXtfaWQ6MH0mbD0je2xpbWl0fSZzPXtyYW5kOjF9JmFwaUtleT0wWTVYX1FrMnVPSlJkSEpXSktTUldrNmw2SnFWVFMyeVwiXG4gICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgIGNhY2hlOiB0cnVlXG4gICAgc3VjY2Vzczogb25zdWNjZXNzXG4gICAgZXJyb3I6KGUpIC0+XG4gICAgICBjb25zb2xlLmxvZyBlXG5cblxuZ2V0X3JlY29yZHMyID0gKHF1ZXJ5LCBsaW1pdCwgb25zdWNjZXNzKSAtPlxuICAkLmFqYXhcbiAgICB1cmw6XCJodHRwOi8vNDYuMTAxLjMuNzk6ODAvcmVzdC9kYi9nb3ZzXCJcbiAgICBkYXRhOlxuICAgICAgI2ZpbHRlcjpcImxhdGl0dWRlPjMyIEFORCBsYXRpdHVkZTwzNCBBTkQgbG9uZ2l0dWRlPi04NyBBTkQgbG9uZ2l0dWRlPC04NlwiXG4gICAgICBmaWx0ZXI6cXVlcnlcbiAgICAgIGZpZWxkczpcIl9pZCxpbmNfaWQsZ292X25hbWUsZ292X3R5cGUsY2l0eSx6aXAsc3RhdGUsbGF0aXR1ZGUsbG9uZ2l0dWRlLGFsdF9uYW1lXCJcbiAgICAgIGFwcF9uYW1lOlwiZ292d2lraVwiXG4gICAgICBvcmRlcjpcInJhbmRcIlxuICAgICAgbGltaXQ6bGltaXRcblxuICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICBjYWNoZTogdHJ1ZVxuICAgIHN1Y2Nlc3M6IG9uc3VjY2Vzc1xuICAgIGVycm9yOihlKSAtPlxuICAgICAgY29uc29sZS5sb2cgZVxuXG4jIEdFT0NPRElORyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbnBpbkltYWdlID0gbmV3IChnb29nbGUubWFwcy5NYXJrZXJJbWFnZSkoXG4gICdodHRwOi8vY2hhcnQuYXBpcy5nb29nbGUuY29tL2NoYXJ0P2Noc3Q9ZF9tYXBfcGluX2xldHRlciZjaGxkPVp8Nzc3N0JCfEZGRkZGRicgLFxuICBuZXcgKGdvb2dsZS5tYXBzLlNpemUpKDIxLCAzNCksXG4gIG5ldyAoZ29vZ2xlLm1hcHMuUG9pbnQpKDAsIDApLFxuICBuZXcgKGdvb2dsZS5tYXBzLlBvaW50KSgxMCwgMzQpXG4gIClcblxuXG5nZW9jb2RlX2FkZHIgPSAoYWRkcixkYXRhKSAtPlxuICBHTWFwcy5nZW9jb2RlXG4gICAgYWRkcmVzczogYWRkclxuICAgIGNhbGxiYWNrOiAocmVzdWx0cywgc3RhdHVzKSAtPlxuICAgICAgaWYgc3RhdHVzID09ICdPSydcbiAgICAgICAgbGF0bG5nID0gcmVzdWx0c1swXS5nZW9tZXRyeS5sb2NhdGlvblxuICAgICAgICBtYXAuc2V0Q2VudGVyIGxhdGxuZy5sYXQoKSwgbGF0bG5nLmxuZygpXG4gICAgICAgIG1hcC5hZGRNYXJrZXJcbiAgICAgICAgICBsYXQ6IGxhdGxuZy5sYXQoKVxuICAgICAgICAgIGxuZzogbGF0bG5nLmxuZygpXG4gICAgICAgICAgc2l6ZTogJ3NtYWxsJ1xuICAgICAgICAgIHRpdGxlOiByZXN1bHRzWzBdLmZvcm1hdHRlZF9hZGRyZXNzXG4gICAgICAgICAgaW5mb1dpbmRvdzpcbiAgICAgICAgICAgIGNvbnRlbnQ6IHJlc3VsdHNbMF0uZm9ybWF0dGVkX2FkZHJlc3NcbiAgICAgICAgXG4gICAgICAgIGlmIGRhdGFcbiAgICAgICAgICBtYXAuYWRkTWFya2VyXG4gICAgICAgICAgICBsYXQ6IGRhdGEubGF0aXR1ZGVcbiAgICAgICAgICAgIGxuZzogZGF0YS5sb25naXR1ZGVcbiAgICAgICAgICAgIHNpemU6ICdzbWFsbCdcbiAgICAgICAgICAgIGNvbG9yOiAnYmx1ZSdcbiAgICAgICAgICAgIGljb246IHBpbkltYWdlXG4gICAgICAgICAgICB0aXRsZTogIFwiI3tkYXRhLmxhdGl0dWRlfSAje2RhdGEubG9uZ2l0dWRlfVwiXG4gICAgICAgICAgICBpbmZvV2luZG93OlxuICAgICAgICAgICAgICBjb250ZW50OiBcIiN7ZGF0YS5sYXRpdHVkZX0gI3tkYXRhLmxvbmdpdHVkZX1cIlxuICAgICAgICAgICAgXG4gICAgICAgICQoJy5nb3ZtYXAtZm91bmQnKS5odG1sIFwiPHN0cm9uZz5GT1VORDogPC9zdHJvbmc+I3tyZXN1bHRzWzBdLmZvcm1hdHRlZF9hZGRyZXNzfVwiXG4gICAgICByZXR1cm5cblxuXG5jbGVhcj0ocyktPlxuICByZXR1cm4gaWYgcy5tYXRjaCgvIGJveCAvaSkgdGhlbiAnJyBlbHNlIHNcblxuZ2VvY29kZSA9IChkYXRhKSAtPlxuICBhZGRyID0gXCIje2NsZWFyKGRhdGEuYWRkcmVzczEpfSAje2NsZWFyKGRhdGEuYWRkcmVzczIpfSwgI3tkYXRhLmNpdHl9LCAje2RhdGEuc3RhdGV9ICN7ZGF0YS56aXB9LCBVU0FcIlxuICAkKCcjZ292YWRkcmVzcycpLnZhbChhZGRyKVxuICBnZW9jb2RlX2FkZHIgYWRkciwgZGF0YVxuXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgZ2VvY29kZTogZ2VvY29kZVxuICBnb2NvZGVfYWRkcjogZ2VvY29kZV9hZGRyXG4gIG9uX2JvdW5kc19jaGFuZ2VkOiBvbl9ib3VuZHNfY2hhbmdlZFxuICBvbl9ib3VuZHNfY2hhbmdlZF9sYXRlcjogb25fYm91bmRzX2NoYW5nZWRfbGF0ZXJcbiAgbWFwOiBtYXBcbiIsIlxucXVlcnlfbWF0Y2hlciA9IHJlcXVpcmUoJy4vcXVlcnltYXRjaGVyLmNvZmZlZScpXG5cbmNsYXNzIEdvdlNlbGVjdG9yXG4gIFxuICAjIHN0dWIgb2YgYSBjYWxsYmFjayB0byBlbnZva2Ugd2hlbiB0aGUgdXNlciBzZWxlY3RzIHNvbWV0aGluZ1xuICBvbl9zZWxlY3RlZDogKGV2dCwgZGF0YSwgbmFtZSkgLT5cblxuXG4gIGNvbnN0cnVjdG9yOiAoQGh0bWxfc2VsZWN0b3IsIGRvY3NfdXJsLCBAbnVtX2l0ZW1zKSAtPlxuICAgICQuYWpheFxuICAgICAgdXJsOiBkb2NzX3VybFxuICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgY2FjaGU6IHRydWVcbiAgICAgIHN1Y2Nlc3M6IEBzdGFydFN1Z2dlc3Rpb25cbiAgICAgIFxuXG5cblxuICBzdWdnZXN0aW9uVGVtcGxhdGUgOiBIYW5kbGViYXJzLmNvbXBpbGUoXCJcIlwiXG4gICAgPGRpdiBjbGFzcz1cInN1Z2ctYm94XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwic3VnZy1zdGF0ZVwiPnt7e3N0YXRlfX19PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwic3VnZy1uYW1lXCI+e3t7Z292X25hbWV9fX08L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJzdWdnLXR5cGVcIj57e3tnb3ZfdHlwZX19fTwvZGl2PlxuICAgIDwvZGl2PlwiXCJcIilcblxuXG5cbiAgZW50ZXJlZF92YWx1ZSA9IFwiXCJcblxuICBnb3ZzX2FycmF5ID0gW11cblxuICBjb3VudF9nb3ZzIDogKCkgLT5cbiAgICBjb3VudCA9MFxuICAgIGZvciBkIGluIEBnb3ZzX2FycmF5XG4gICAgICBpZiBHT1ZXSUtJLnN0YXRlX2ZpbHRlciBhbmQgZC5zdGF0ZSBpc250IEdPVldJS0kuc3RhdGVfZmlsdGVyIHRoZW4gY29udGludWVcbiAgICAgIGlmIEdPVldJS0kuZ292X3R5cGVfZmlsdGVyIGFuZCBkLmdvdl90eXBlIGlzbnQgR09WV0lLSS5nb3ZfdHlwZV9maWx0ZXIgdGhlbiBjb250aW51ZVxuICAgICAgY291bnQrK1xuICAgIHJldHVybiBjb3VudFxuXG5cbiAgc3RhcnRTdWdnZXN0aW9uIDogKGdvdnMpID0+XG4gICAgI0Bnb3ZzX2FycmF5ID0gZ292c1xuICAgIEBnb3ZzX2FycmF5ID0gZ292cy5yZWNvcmRcbiAgICAkKCcudHlwZWFoZWFkJykua2V5dXAgKGV2ZW50KSA9PlxuICAgICAgQGVudGVyZWRfdmFsdWUgPSAkKGV2ZW50LnRhcmdldCkudmFsKClcbiAgICBcbiAgICAkKEBodG1sX3NlbGVjdG9yKS5hdHRyICdwbGFjZWhvbGRlcicsICdHT1ZFUk5NRU5UIE5BTUUnXG4gICAgJChAaHRtbF9zZWxlY3RvcikudHlwZWFoZWFkKFxuICAgICAgICBoaW50OiBmYWxzZVxuICAgICAgICBoaWdobGlnaHQ6IGZhbHNlXG4gICAgICAgIG1pbkxlbmd0aDogMVxuICAgICAgICBjbGFzc05hbWVzOlxuICAgICAgICBcdG1lbnU6ICd0dC1kcm9wZG93bi1tZW51J1xuICAgICAgLFxuICAgICAgICBuYW1lOiAnZ292X25hbWUnXG4gICAgICAgIGRpc3BsYXlLZXk6ICdnb3ZfbmFtZSdcbiAgICAgICAgc291cmNlOiBxdWVyeV9tYXRjaGVyKEBnb3ZzX2FycmF5LCBAbnVtX2l0ZW1zKVxuICAgICAgICAjc291cmNlOiBibG9vZGhvdW5kLnR0QWRhcHRlcigpXG4gICAgICAgIHRlbXBsYXRlczogc3VnZ2VzdGlvbjogQHN1Z2dlc3Rpb25UZW1wbGF0ZVxuICAgIClcbiAgICAub24gJ3R5cGVhaGVhZDpzZWxlY3RlZCcsICAoZXZ0LCBkYXRhLCBuYW1lKSA9PlxuICAgICAgICAkKCcudHlwZWFoZWFkJykudHlwZWFoZWFkICd2YWwnLCBAZW50ZXJlZF92YWx1ZVxuICAgICAgICBAb25fc2VsZWN0ZWQoZXZ0LCBkYXRhLCBuYW1lKVxuICAgXG4gICAgLm9uICd0eXBlYWhlYWQ6Y3Vyc29yY2hhbmdlZCcsIChldnQsIGRhdGEsIG5hbWUpID0+XG4gICAgICAgICQoJy50eXBlYWhlYWQnKS52YWwgQGVudGVyZWRfdmFsdWVcbiAgICBcblxuICAgICQoJy5nb3YtY291bnRlcicpLnRleHQgQGNvdW50X2dvdnMoKVxuICAgIHJldHVyblxuXG5cblxuXG5cbm1vZHVsZS5leHBvcnRzPUdvdlNlbGVjdG9yXG5cblxuXG4iLCIjIyNcbmZpbGU6IG1haW4uY29mZmUgLS0gVGhlIGVudHJ5IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIDpcbmdvdl9maW5kZXIgPSBuZXcgR292RmluZGVyXG5nb3ZfZGV0YWlscyA9IG5ldyBHb3ZEZXRhaWxzXG5nb3ZfZmluZGVyLm9uX3NlbGVjdCA9IGdvdl9kZXRhaWxzLnNob3dcbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIyNcblxuR292U2VsZWN0b3IgPSByZXF1aXJlICcuL2dvdnNlbGVjdG9yLmNvZmZlZSdcbiNfanFncyAgICAgICA9IHJlcXVpcmUgJy4vanF1ZXJ5LmdvdnNlbGVjdG9yLmNvZmZlZSdcblRlbXBsYXRlczIgICAgICA9IHJlcXVpcmUgJy4vdGVtcGxhdGVzMi5jb2ZmZWUnXG5nb3ZtYXAgICAgICA9IHJlcXVpcmUgJy4vZ292bWFwLmNvZmZlZSdcbiNzY3JvbGx0byA9IHJlcXVpcmUgJy4uL2Jvd2VyX2NvbXBvbmVudHMvanF1ZXJ5LnNjcm9sbFRvL2pxdWVyeS5zY3JvbGxUby5qcydcblxud2luZG93LkdPVldJS0kgPVxuICBzdGF0ZV9maWx0ZXIgOiAnJ1xuICBnb3ZfdHlwZV9maWx0ZXIgOiAnJ1xuICBnb3ZfdHlwZV9maWx0ZXJfMiA6IFsnQ2l0eScsICdTY2hvb2wgRGlzdHJpY3QnLCAnU3BlY2lhbCBEaXN0cmljdCddXG5cbiAgc2hvd19zZWFyY2hfcGFnZTogKCkgLT5cbiAgICAkKHdpbmRvdykuc2Nyb2xsVG8oJzBweCcsMTApXG4gICAgJCgnI2RhdGFDb250YWluZXInKS5oaWRlKClcbiAgICAkKCcjc2VhcmNoSWNvbicpLmhpZGUoKVxuICAgICQoJyNzZWFyY2hDb250YWluZXInKS5mYWRlSW4oMzAwKVxuICAgIGZvY3VzX3NlYXJjaF9maWVsZCA1MDBcblxuICBzaG93X2RhdGFfcGFnZTogKCkgLT5cbiAgICAkKHdpbmRvdykuc2Nyb2xsVG8oJzBweCcsMTApXG4gICAgJCgnI3NlYXJjaEljb24nKS5zaG93KClcbiAgICAkKCcjZGF0YUNvbnRhaW5lcicpLmZhZGVJbigzMDApXG4gICAgJCgnI3NlYXJjaENvbnRhaW5lcicpLmhpZGUoKVxuICAgICMkKHdpbmRvdykuc2Nyb2xsVG8oJyNwQmFja1RvU2VhcmNoJyw2MDApXG5cblxuXG5cbiNnb3Zfc2VsZWN0b3IgPSBuZXcgR292U2VsZWN0b3IgJy50eXBlYWhlYWQnLCAnZGF0YS9oX3R5cGVzLmpzb24nLCA3XG5nb3Zfc2VsZWN0b3IgPSBuZXcgR292U2VsZWN0b3IgJy50eXBlYWhlYWQnLCAnZGF0YS9oX3R5cGVzX2NhLmpzb24nLCA3XG4jZ292X3NlbGVjdG9yID0gbmV3IEdvdlNlbGVjdG9yICcudHlwZWFoZWFkJywgJ2h0dHA6Ly80Ni4xMDEuMy43OS9yZXN0L2RiL2dvdnM/ZmlsdGVyPXN0YXRlPSUyMkNBJTIyJmFwcF9uYW1lPWdvdndpa2kmZmllbGRzPV9pZCxnb3ZfbmFtZSxnb3ZfdHlwZSxzdGF0ZSZsaW1pdD01MDAwJywgN1xudGVtcGxhdGVzID0gbmV3IFRlbXBsYXRlczJcbmFjdGl2ZV90YWI9XCJcIlxuXG4jIExvYWQgaW50cm9kdWN0b3J5IHRleHQgZnJvbSB0ZXh0cy9pbnRyby10ZXh0Lmh0bWwgdG8gI2ludHJvLXRleHQgY29udGFpbmVyLlxuJC5nZXQgXCJ0ZXh0cy9pbnRyby10ZXh0Lmh0bWxcIiwgKGRhdGEpIC0+XG4gICQoXCIjaW50cm8tdGV4dFwiKS5odG1sIGRhdGFcblxuIyBmaXJlIGNsaWVudC1zaWRlIFVSTCByb3V0aW5nXG5yb3V0ZXIgPSBuZXcgR3JhcG5lbFxucm91dGVyLmdldCAnOmlkJywgKHJlcSkgLT5cbiAgaWQgPSByZXEucGFyYW1zLmlkXG4gIGNvbnNvbGUubG9nIFwiUk9VVEVSIElEPSN7aWR9XCJcbiAgZ2V0X2VsZWN0ZWRfb2ZmaWNpYWxzID0gKGdvdl9pZCwgbGltaXQsIG9uc3VjY2VzcykgLT5cbiAgICAkLmFqYXhcbiAgICAgIHVybDpcImh0dHA6Ly80Ni4xMDEuMy43OTo4MC9yZXN0L2RiL2VsZWN0ZWRfb2ZmaWNpYWxzXCJcbiAgICAgIGRhdGE6XG4gICAgICAgIGZpbHRlcjpcImdvdnNfaWQ9XCIgKyBnb3ZfaWRcbiAgICAgICAgZmllbGRzOlwiZ292c19pZCx0aXRsZSxmdWxsX25hbWUsZW1haWxfYWRkcmVzcyxwaG90b191cmwsdGVybV9leHBpcmVzXCJcbiAgICAgICAgYXBwX25hbWU6XCJnb3Z3aWtpXCJcbiAgICAgICAgb3JkZXI6XCJkaXNwbGF5X29yZGVyXCJcbiAgICAgICAgbGltaXQ6bGltaXRcblxuICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgY2FjaGU6IHRydWVcbiAgICAgIHN1Y2Nlc3M6IG9uc3VjY2Vzc1xuICAgICAgZXJyb3I6KGUpIC0+XG4gICAgICAgIGNvbnNvbGUubG9nIGVcbiAgaWYgaXNOYU4oaWQpXG4gICAgaWQgPSBpZC5yZXBsYWNlKC9fL2csJyAnKVxuICAgIGJ1aWxkX2RhdGEgPSAoaWQsIGxpbWl0LCBvbnN1Y2Nlc3MpIC0+XG4gICAgICAkLmFqYXhcbiAgICAgICAgdXJsOlwiaHR0cDovLzQ2LjEwMS4zLjc5OjgwL3Jlc3QvZGIvZ292c1wiXG4gICAgICAgIGRhdGE6XG4gICAgICAgICAgZmlsdGVyOlwiYWx0X25hbWU9JyN7aWR9J1wiXG4gICAgICAgICAgYXBwX25hbWU6XCJnb3Z3aWtpXCJcbiAgICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgICBjYWNoZTogdHJ1ZVxuICAgICAgICBzdWNjZXNzOiAoZGF0YSkgLT5cbiAgICAgICAgICBlbGVjdGVkX29mZmljaWFscyA9IGdldF9lbGVjdGVkX29mZmljaWFscyBkYXRhLnJlY29yZFswXS5faWQsIDI1LCAoZWxlY3RlZF9vZmZpY2lhbHNfZGF0YSwgdGV4dFN0YXR1cywganFYSFIpIC0+XG4gICAgICAgICAgICBnb3ZfaWQgPSBkYXRhLnJlY29yZFswXS5faWRcbiAgICAgICAgICAgIGRhdGEgPSBuZXcgT2JqZWN0KClcbiAgICAgICAgICAgIGRhdGEuX2lkID0gZ292X2lkXG4gICAgICAgICAgICBkYXRhLmVsZWN0ZWRfb2ZmaWNpYWxzID0gZWxlY3RlZF9vZmZpY2lhbHNfZGF0YVxuICAgICAgICAgICAgZGF0YS5nb3ZfbmFtZSA9IFwiXCJcbiAgICAgICAgICAgIGRhdGEuZ292X3R5cGUgPSBcIlwiXG4gICAgICAgICAgICBkYXRhLnN0YXRlID0gXCJcIlxuICAgICAgICAgICAgJCgnI2RldGFpbHMnKS5odG1sIHRlbXBsYXRlcy5nZXRfaHRtbCgwLCBkYXRhKVxuICAgICAgICAgICAgZ2V0X3JlY29yZDIgZGF0YS5faWRcbiAgICAgICAgICAgIGFjdGl2YXRlX3RhYigpXG4gICAgICAgICAgICBHT1ZXSUtJLnNob3dfZGF0YV9wYWdlKClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBlcnJvcjooZSkgLT5cbiAgICAgICAgICBjb25zb2xlLmxvZyBlXG4gICAgYnVpbGRfZGF0YShpZClcbiAgZWxzZVxuICAgIGVsZWN0ZWRfb2ZmaWNpYWxzID0gZ2V0X2VsZWN0ZWRfb2ZmaWNpYWxzIGlkLCAyNSwgKGVsZWN0ZWRfb2ZmaWNpYWxzX2RhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSAtPlxuICAgICAgZGF0YSA9IG5ldyBPYmplY3QoKVxuICAgICAgZGF0YS5faWQgPSBpZFxuICAgICAgZGF0YS5lbGVjdGVkX29mZmljaWFscyA9IGVsZWN0ZWRfb2ZmaWNpYWxzX2RhdGFcbiAgICAgIGRhdGEuZ292X25hbWUgPSBcIlwiXG4gICAgICBkYXRhLmdvdl90eXBlID0gXCJcIlxuICAgICAgZGF0YS5zdGF0ZSA9IFwiXCJcbiAgICAgICQoJyNkZXRhaWxzJykuaHRtbCB0ZW1wbGF0ZXMuZ2V0X2h0bWwoMCwgZGF0YSlcbiAgICAgIGdldF9yZWNvcmQyIGRhdGEuX2lkXG4gICAgICBhY3RpdmF0ZV90YWIoKVxuICAgICAgR09WV0lLSS5zaG93X2RhdGFfcGFnZSgpXG4gICAgICByZXR1cm5cblxuXG5nZXRfY291bnRpZXMgPSAoY2FsbGJhY2spIC0+XG4gICQuYWpheFxuICAgIHVybDogJ2RhdGEvY291bnR5X2dlb2dyYXBoeV9jYS5qc29uJ1xuICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICBjYWNoZTogdHJ1ZVxuICAgIHN1Y2Nlc3M6IChjb3VudGllc0pTT04pIC0+XG4gICAgICBjYWxsYmFjayBjb3VudGllc0pTT05cblxuZHJhd19wb2x5Z29ucyA9IChjb3VudGllc0pTT04pIC0+XG4gIGZvciBjb3VudHkgaW4gY291bnRpZXNKU09OLmZlYXR1cmVzXG4gICAgZ292bWFwLm1hcC5kcmF3UG9seWdvbih7XG4gICAgICBwYXRoczogY291bnR5Lmdlb21ldHJ5LmNvb3JkaW5hdGVzXG4gICAgICB1c2VHZW9KU09OOiB0cnVlXG4gICAgICBzdHJva2VDb2xvcjogJyNGRjAwMDAnXG4gICAgICBzdHJva2VPcGFjaXR5OiAwLjZcbiAgICAgIHN0cm9rZVdlaWdodDogMS41XG4gICAgICBmaWxsQ29sb3I6ICcjRkYwMDAwJ1xuICAgICAgZmlsbE9wYWNpdHk6IDAuMTVcbiAgICAgIGNvdW50eUlkOiBjb3VudHkucHJvcGVydGllcy5faWRcbiAgICAgIGFsdE5hbWU6IGNvdW50eS5wcm9wZXJ0aWVzLmFsdF9uYW1lXG4gICAgICBtYXJrZXI6IG5ldyBNYXJrZXJXaXRoTGFiZWwoe1xuICAgICAgICBwb3NpdGlvbjogbmV3IGdvb2dsZS5tYXBzLkxhdExuZygwLDApLFxuICAgICAgICBkcmFnZ2FibGU6IGZhbHNlLFxuICAgICAgICByYWlzZU9uRHJhZzogZmFsc2UsXG4gICAgICAgIG1hcDogZ292bWFwLm1hcC5tYXAsXG4gICAgICAgIGxhYmVsQ29udGVudDogY291bnR5LnByb3BlcnRpZXMubmFtZSxcbiAgICAgICAgbGFiZWxBbmNob3I6IG5ldyBnb29nbGUubWFwcy5Qb2ludCgtMTUsIDI1KSxcbiAgICAgICAgbGFiZWxDbGFzczogXCJsYWJlbC10b29sdGlwXCIsXG4gICAgICAgIGxhYmVsU3R5bGU6IHtvcGFjaXR5OiAxLjB9LFxuICAgICAgICBpY29uOiBcImh0dHA6Ly9wbGFjZWhvbGQuaXQvMXgxXCIsXG4gICAgICAgIHZpc2libGU6IGZhbHNlXG4gICAgICB9KVxuICAgICAgbW91c2VvdmVyOiAtPlxuICAgICAgICB0aGlzLnNldE9wdGlvbnMoe2ZpbGxDb2xvcjogXCIjMDBGRjAwXCJ9KVxuICAgICAgbW91c2Vtb3ZlOiAoZXZlbnQpIC0+XG4gICAgICAgIHRoaXMubWFya2VyLnNldFBvc2l0aW9uKGV2ZW50LmxhdExuZylcbiAgICAgICAgdGhpcy5tYXJrZXIuc2V0VmlzaWJsZSh0cnVlKVxuICAgICAgbW91c2VvdXQ6IC0+XG4gICAgICAgIHRoaXMuc2V0T3B0aW9ucyh7ZmlsbENvbG9yOiBcIiNGRjAwMDBcIn0pXG4gICAgICAgIHRoaXMubWFya2VyLnNldFZpc2libGUoZmFsc2UpXG4gICAgICBjbGljazogLT5cbiAgICAgICAgcm91dGVyLm5hdmlnYXRlIFwiI3t0aGlzLmNvdW50eUlkfVwiXG4gICAgfSlcblxuZ2V0X2NvdW50aWVzIGRyYXdfcG9seWdvbnNcblxud2luZG93LnJlbWVtYmVyX3RhYiA9KG5hbWUpLT4gYWN0aXZlX3RhYiA9IG5hbWVcblxuI3dpbmRvdy5nZW9jb2RlX2FkZHIgPSAoaW5wdXRfc2VsZWN0b3IpLT4gZ292bWFwLmdvY29kZV9hZGRyICQoaW5wdXRfc2VsZWN0b3IpLnZhbCgpXG5cbiQoZG9jdW1lbnQpLm9uICdjbGljaycsICcjZmllbGRUYWJzIGEnLCAoZSkgLT5cbiAgYWN0aXZlX3RhYiA9ICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCd0YWJuYW1lJylcbiAgY29uc29sZS5sb2cgYWN0aXZlX3RhYlxuICAkKFwiI3RhYnNDb250ZW50IC50YWItcGFuZVwiKS5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKVxuICAkKCQoZS5jdXJyZW50VGFyZ2V0KS5hdHRyKCdocmVmJykpLmFkZENsYXNzKFwiYWN0aXZlXCIpXG4gIHRlbXBsYXRlcy5hY3RpdmF0ZSAwLCBhY3RpdmVfdGFiXG5cbiAgaWYgYWN0aXZlX3RhYiA9PSAnRmluYW5jaWFsIFN0YXRlbWVudHMnXG4gICAgZmluVmFsV2lkdGhNYXgxID0gMFxuICAgIGZpblZhbFdpZHRoTWF4MiA9IDBcbiAgICBmaW5WYWxXaWR0aE1heDMgPSAwXG5cbiAgICAkKCcuZmluLXZhbHVlcy1ibG9jayBbZGF0YS1jb2w9XCIxXCJdJykuZmluZCgnLmZpbi12YWwnKS5lYWNoICgpIC0+XG4gICAgICAgIHRoaXNGaW5WYWxXaWR0aCA9ICQodGhpcykud2lkdGgoKVxuXG4gICAgICAgIGlmIHRoaXNGaW5WYWxXaWR0aCA+IGZpblZhbFdpZHRoTWF4MVxuICAgICAgICAgICAgZmluVmFsV2lkdGhNYXgxID0gdGhpc0ZpblZhbFdpZHRoXG5cbiAgICAkKCcuZmluLXZhbHVlcy1ibG9jayBbZGF0YS1jb2w9XCIyXCJdJykuZmluZCgnLmZpbi12YWwnKS5lYWNoICgpIC0+XG4gICAgICAgIHRoaXNGaW5WYWxXaWR0aCA9ICQodGhpcykud2lkdGgoKVxuXG4gICAgICAgIGlmIHRoaXNGaW5WYWxXaWR0aCA+IGZpblZhbFdpZHRoTWF4MlxuICAgICAgICAgICAgZmluVmFsV2lkdGhNYXgyID0gdGhpc0ZpblZhbFdpZHRoXG5cbiAgICAkKCcuZmluLXZhbHVlcy1ibG9jayBbZGF0YS1jb2w9XCIzXCJdJykuZmluZCgnLmZpbi12YWwnKS5lYWNoICgpIC0+XG4gICAgICAgIHRoaXNGaW5WYWxXaWR0aCA9ICQodGhpcykud2lkdGgoKVxuXG4gICAgICAgIGlmIHRoaXNGaW5WYWxXaWR0aCA+IGZpblZhbFdpZHRoTWF4M1xuICAgICAgICAgICAgZmluVmFsV2lkdGhNYXgzID0gdGhpc0ZpblZhbFdpZHRoXG5cbiAgICAkKCcuZmluLXZhbHVlcy1ibG9jayBbZGF0YS1jb2w9XCIxXCJdIC5jdXJyZW5jeS1zaWduJykuY3NzKCdyaWdodCcsIGZpblZhbFdpZHRoTWF4MSArIDI3KVxuICAgICQoJy5maW4tdmFsdWVzLWJsb2NrIFtkYXRhLWNvbD1cIjJcIl0gLmN1cnJlbmN5LXNpZ24nKS5jc3MoJ3JpZ2h0JywgZmluVmFsV2lkdGhNYXgyICsgMjcpXG4gICAgJCgnLmZpbi12YWx1ZXMtYmxvY2sgW2RhdGEtY29sPVwiM1wiXSAuY3VycmVuY3ktc2lnbicpLmNzcygncmlnaHQnLCBmaW5WYWxXaWR0aE1heDMgKyAyNylcblxuXG4kKGRvY3VtZW50KS50b29sdGlwKHtzZWxlY3RvcjogXCJbY2xhc3M9J21lZGlhLXRvb2x0aXAnXVwiLHRyaWdnZXI6J2NsaWNrJ30pXG5cbmFjdGl2YXRlX3RhYiA9KCkgLT5cbiAgJChcIiNmaWVsZFRhYnMgYVtocmVmPScjdGFiI3thY3RpdmVfdGFifSddXCIpLnRhYignc2hvdycpXG5cbmdvdl9zZWxlY3Rvci5vbl9zZWxlY3RlZCA9IChldnQsIGRhdGEsIG5hbWUpIC0+XG4gICNyZW5kZXJEYXRhICcjZGV0YWlscycsIGRhdGFcbiAgZ2V0X2VsZWN0ZWRfb2ZmaWNpYWxzIGRhdGEuX2lkLCAyNSwgKGRhdGEyLCB0ZXh0U3RhdHVzLCBqcVhIUikgLT5cbiAgICBkYXRhLmVsZWN0ZWRfb2ZmaWNpYWxzID0gZGF0YTJcbiAgICAkKCcjZGV0YWlscycpLmh0bWwgdGVtcGxhdGVzLmdldF9odG1sKDAsIGRhdGEpXG4gICAgI2dldF9yZWNvcmQgXCJpbmNfaWQ6I3tkYXRhW1wiaW5jX2lkXCJdfVwiXG4gICAgZ2V0X3JlY29yZDIgZGF0YVtcIl9pZFwiXVxuICAgIGFjdGl2YXRlX3RhYigpXG4gICAgR09WV0lLSS5zaG93X2RhdGFfcGFnZSgpXG4gICAgcm91dGVyLm5hdmlnYXRlIFwiI3tkYXRhLl9pZH1cIlxuICAgIHJldHVyblxuXG5cbmdldF9yZWNvcmQgPSAocXVlcnkpIC0+XG4gICQuYWpheFxuICAgIHVybDogXCJodHRwczovL2FwaS5tb25nb2xhYi5jb20vYXBpLzEvZGF0YWJhc2VzL2dvdndpa2kvY29sbGVjdGlvbnMvZ292cy8/cT17I3txdWVyeX19JmY9e19pZDowfSZsPTEmYXBpS2V5PTBZNVhfUWsydU9KUmRISldKS1NSV2s2bDZKcVZUUzJ5XCJcbiAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgY2FjaGU6IHRydWVcbiAgICBzdWNjZXNzOiAoZGF0YSkgLT5cbiAgICAgIGlmIGRhdGEubGVuZ3RoXG4gICAgICAgICQoJyNkZXRhaWxzJykuaHRtbCB0ZW1wbGF0ZXMuZ2V0X2h0bWwoMCwgZGF0YVswXSlcbiAgICAgICAgYWN0aXZhdGVfdGFiKClcbiAgICAgICAgI2dvdm1hcC5nZW9jb2RlIGRhdGFbMF1cbiAgICAgIHJldHVyblxuICAgIGVycm9yOihlKSAtPlxuICAgICAgY29uc29sZS5sb2cgZVxuXG5cbmdldF9yZWNvcmQyID0gKHJlY2lkKSAtPlxuICAkLmFqYXhcbiAgICAjdXJsOiBcImh0dHBzOi8vZHNwLWdvdndpa2kuY2xvdWQuZHJlYW1mYWN0b3J5LmNvbTo0NDMvcmVzdC9nb3Z3aWtpX2FwaS9nb3ZzLyN7cmVjaWR9XCJcbiAgICB1cmw6IFwiaHR0cDovLzQ2LjEwMS4zLjc5OjgwL3Jlc3QvZGIvZ292cy8je3JlY2lkfVwiXG4gICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgIGhlYWRlcnM6IHtcIlgtRHJlYW1GYWN0b3J5LUFwcGxpY2F0aW9uLU5hbWVcIjpcImdvdndpa2lcIn1cbiAgICBjYWNoZTogdHJ1ZVxuICAgIHN1Y2Nlc3M6IChkYXRhKSAtPlxuICAgICAgaWYgZGF0YVxuICAgICAgICBnZXRfZmluYW5jaWFsX3N0YXRlbWVudHMgZGF0YS5faWQsIChkYXRhMiwgdGV4dFN0YXR1cywganFYSFIpIC0+XG4gICAgICAgICAgZGF0YS5maW5hbmNpYWxfc3RhdGVtZW50cyA9IGRhdGEyXG4gICAgICAgICAgZ2V0X2VsZWN0ZWRfb2ZmaWNpYWxzIGRhdGEuX2lkLCAyNSwgKGRhdGEzLCB0ZXh0U3RhdHVzMiwganFYSFIyKSAtPlxuICAgICAgICAgICAgZGF0YS5lbGVjdGVkX29mZmljaWFscyA9IGRhdGEzXG4gICAgICAgICAgICBnZXRfbWF4X3JhbmtzIChtYXhfcmFua3NfcmVzcG9uc2UpIC0+XG4gICAgICAgICAgICAgIGRhdGEubWF4X3JhbmtzID0gbWF4X3JhbmtzX3Jlc3BvbnNlLnJlY29yZFswXVxuICAgICAgICAgICAgICAkKCcjZGV0YWlscycpLmh0bWwgdGVtcGxhdGVzLmdldF9odG1sKDAsIGRhdGEpXG4gICAgICAgICAgICAgIGFjdGl2YXRlX3RhYigpXG4gICAgICAgICAgICAjZ292bWFwLmdlb2NvZGUgZGF0YVswXVxuICAgICAgcmV0dXJuXG4gICAgZXJyb3I6KGUpIC0+XG4gICAgICBjb25zb2xlLmxvZyBlXG5cblxuZ2V0X2VsZWN0ZWRfb2ZmaWNpYWxzID0gKGdvdl9pZCwgbGltaXQsIG9uc3VjY2VzcykgLT5cbiAgJC5hamF4XG4gICAgdXJsOlwiaHR0cDovLzQ2LjEwMS4zLjc5OjgwL3Jlc3QvZGIvZWxlY3RlZF9vZmZpY2lhbHNcIlxuICAgIGRhdGE6XG4gICAgICBmaWx0ZXI6XCJnb3ZzX2lkPVwiICsgZ292X2lkXG4gICAgICBmaWVsZHM6XCJnb3ZzX2lkLHRpdGxlLGZ1bGxfbmFtZSxlbWFpbF9hZGRyZXNzLHBob3RvX3VybCx0ZXJtX2V4cGlyZXMsdGVsZXBob25lX251bWJlclwiXG4gICAgICBhcHBfbmFtZTpcImdvdndpa2lcIlxuICAgICAgb3JkZXI6XCJkaXNwbGF5X29yZGVyXCJcbiAgICAgIGxpbWl0OmxpbWl0XG5cbiAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgY2FjaGU6IHRydWVcbiAgICBzdWNjZXNzOiBvbnN1Y2Nlc3NcbiAgICBlcnJvcjooZSkgLT5cbiAgICAgIGNvbnNvbGUubG9nIGVcblxuZ2V0X2ZpbmFuY2lhbF9zdGF0ZW1lbnRzID0gKGdvdl9pZCwgb25zdWNjZXNzKSAtPlxuICAkLmFqYXhcbiAgICB1cmw6XCJodHRwOi8vNDYuMTAxLjMuNzk6ODAvcmVzdC9kYi9fcHJvYy9nZXRfZmluYW5jaWFsX3N0YXRlbWVudHNcIlxuICAgIGRhdGE6XG4gICAgICBhcHBfbmFtZTpcImdvdndpa2lcIlxuICAgICAgb3JkZXI6XCJjYXB0aW9uX2NhdGVnb3J5LGRpc3BsYXlfb3JkZXJcIlxuICAgICAgcGFyYW1zOiBbXG4gICAgICAgIG5hbWU6IFwiZ292c19pZFwiXG4gICAgICAgIHBhcmFtX3R5cGU6IFwiSU5cIlxuICAgICAgICB2YWx1ZTogZ292X2lkXG4gICAgICBdXG5cbiAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgY2FjaGU6IHRydWVcbiAgICBzdWNjZXNzOiBvbnN1Y2Nlc3NcbiAgICBlcnJvcjooZSkgLT5cbiAgICAgIGNvbnNvbGUubG9nIGVcblxuXG5nZXRfbWF4X3JhbmtzID0gKG9uc3VjY2VzcykgLT5cbiAgJC5hamF4XG4gICAgdXJsOidodHRwOi8vNDYuMTAxLjMuNzk6ODAvcmVzdC9kYi9tYXhfcmFua3MnXG4gICAgZGF0YTpcbiAgICAgIGFwcF9uYW1lOidnb3Z3aWtpJ1xuICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICBjYWNoZTogdHJ1ZVxuICAgIHN1Y2Nlc3M6IG9uc3VjY2Vzc1xuXG53aW5kb3cuR09WV0lLSS5zaG93X3JlY29yZCA9KHJlYyk9PlxuICAkKCcjZGV0YWlscycpLmh0bWwgdGVtcGxhdGVzLmdldF9odG1sKDAsIHJlYylcbiAgYWN0aXZhdGVfdGFiKClcbiAgR09WV0lLSS5zaG93X2RhdGFfcGFnZSgpXG4gIHJvdXRlci5uYXZpZ2F0ZShyZWMuX2lkKVxuXG5cbndpbmRvdy5HT1ZXSUtJLnNob3dfcmVjb3JkMiA9KHJlYyk9PlxuICBnZXRfZWxlY3RlZF9vZmZpY2lhbHMgcmVjLl9pZCwgMjUsIChkYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikgLT5cbiAgICBjb25zb2xlLmxvZyAnMTIzJ1xuICAgIHJlYy5lbGVjdGVkX29mZmljaWFscyA9IGRhdGFcbiAgICAkKCcjZGV0YWlscycpLmh0bWwgdGVtcGxhdGVzLmdldF9odG1sKDAsIHJlYylcbiAgICBnZXRfcmVjb3JkMiByZWMuX2lkXG4gICAgYWN0aXZhdGVfdGFiKClcbiAgICBHT1ZXSUtJLnNob3dfZGF0YV9wYWdlKClcbiAgICByb3V0ZXIubmF2aWdhdGUgXCIje3JlYy5hbHRfbmFtZS5yZXBsYWNlKC8gL2csJ18nKX1cIlxuXG5cblxuIyMjXG53aW5kb3cuc2hvd19yZWMgPSAocmVjKS0+XG4gICQoJyNkZXRhaWxzJykuaHRtbCB0ZW1wbGF0ZXMuZ2V0X2h0bWwoMCwgcmVjKVxuICBhY3RpdmF0ZV90YWIoKVxuIyMjXG5cbmJ1aWxkX3NlbGVjdG9yID0gKGNvbnRhaW5lciwgdGV4dCwgY29tbWFuZCwgd2hlcmVfdG9fc3RvcmVfdmFsdWUgKSAtPlxuICAkLmFqYXhcbiAgICB1cmw6ICdodHRwczovL2FwaS5tb25nb2xhYi5jb20vYXBpLzEvZGF0YWJhc2VzL2dvdndpa2kvcnVuQ29tbWFuZD9hcGlLZXk9MFk1WF9RazJ1T0pSZEhKV0pLU1JXazZsNkpxVlRTMnknXG4gICAgdHlwZTogJ1BPU1QnXG4gICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvblwiXG4gICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgIGRhdGE6IGNvbW1hbmQgI0pTT04uc3RyaW5naWZ5KGNvbW1hbmQpXG4gICAgY2FjaGU6IHRydWVcbiAgICBzdWNjZXNzOiAoZGF0YSkgPT5cbiAgICAgICNhPSQuZXh0ZW5kIHRydWUgW10sZGF0YVxuICAgICAgdmFsdWVzPWRhdGEudmFsdWVzXG4gICAgICBidWlsZF9zZWxlY3RfZWxlbWVudCBjb250YWluZXIsIHRleHQsIHZhbHVlcy5zb3J0KCksIHdoZXJlX3RvX3N0b3JlX3ZhbHVlXG4gICAgICByZXR1cm5cbiAgICBlcnJvcjooZSkgLT5cbiAgICAgIGNvbnNvbGUubG9nIGVcblxuXG5idWlsZF9zZWxlY3RfZWxlbWVudCA9IChjb250YWluZXIsIHRleHQsIGFyciwgd2hlcmVfdG9fc3RvcmVfdmFsdWUgKSAtPlxuICBzICA9IFwiPHNlbGVjdCBjbGFzcz0nZm9ybS1jb250cm9sJyBzdHlsZT0nbWF4d2lkdGg6MTYwcHg7Jz48b3B0aW9uIHZhbHVlPScnPiN7dGV4dH08L29wdGlvbj5cIlxuICBzICs9IFwiPG9wdGlvbiB2YWx1ZT0nI3t2fSc+I3t2fTwvb3B0aW9uPlwiIGZvciB2IGluIGFyciB3aGVuIHZcbiAgcyArPSBcIjwvc2VsZWN0PlwiXG4gIHNlbGVjdCA9ICQocylcbiAgJChjb250YWluZXIpLmFwcGVuZChzZWxlY3QpXG5cbiAgIyBzZXQgZGVmYXVsdCAnQ0EnXG4gIGlmIHRleHQgaXMgJ1N0YXRlLi4nXG4gICAgc2VsZWN0LnZhbCAnQ0EnXG4gICAgd2luZG93LkdPVldJS0kuc3RhdGVfZmlsdGVyPSdDQSdcbiAgICBnb3ZtYXAub25fYm91bmRzX2NoYW5nZWRfbGF0ZXIoKVxuXG4gIHNlbGVjdC5jaGFuZ2UgKGUpIC0+XG4gICAgZWwgPSAkKGUudGFyZ2V0KVxuICAgIHdpbmRvdy5HT1ZXSUtJW3doZXJlX3RvX3N0b3JlX3ZhbHVlXSA9IGVsLnZhbCgpXG4gICAgJCgnLmdvdi1jb3VudGVyJykudGV4dCBnb3Zfc2VsZWN0b3IuY291bnRfZ292cygpXG4gICAgZ292bWFwLm9uX2JvdW5kc19jaGFuZ2VkKClcblxuXG5hZGp1c3RfdHlwZWFoZWFkX3dpZHRoID0oKSAtPlxuICBpbnAgPSAkKCcjbXlpbnB1dCcpXG4gIHBhciA9ICQoJyN0eXBlYWhlZC1jb250YWluZXInKVxuICBpbnAud2lkdGggcGFyLndpZHRoKClcblxuXG5cblxuc3RhcnRfYWRqdXN0aW5nX3R5cGVhaGVhZF93aWR0aCA9KCkgLT5cbiAgJCh3aW5kb3cpLnJlc2l6ZSAtPlxuICAgIGFkanVzdF90eXBlYWhlYWRfd2lkdGgoKVxuXG5cbiMgYWRkIGxpdmUgcmVsb2FkIHRvIHRoZSBzaXRlLiBGb3IgZGV2ZWxvcG1lbnQgb25seS5cbmxpdmVyZWxvYWQgPSAocG9ydCkgLT5cbiAgdXJsPXdpbmRvdy5sb2NhdGlvbi5vcmlnaW4ucmVwbGFjZSAvOlteOl0qJC8sIFwiXCJcbiAgJC5nZXRTY3JpcHQgdXJsICsgXCI6XCIgKyBwb3J0LCA9PlxuICAgICQoJ2JvZHknKS5hcHBlbmQgXCJcIlwiXG4gICAgPGRpdiBzdHlsZT0ncG9zaXRpb246YWJzb2x1dGU7ei1pbmRleDoxMDAwO1xuICAgIHdpZHRoOjEwMCU7IHRvcDowO2NvbG9yOnJlZDsgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgIHBhZGRpbmc6MXB4O2ZvbnQtc2l6ZToxMHB4O2xpbmUtaGVpZ2h0OjEnPmxpdmU8L2Rpdj5cbiAgICBcIlwiXCJcblxuZm9jdXNfc2VhcmNoX2ZpZWxkID0gKG1zZWMpIC0+XG4gIHNldFRpbWVvdXQgKC0+ICQoJyNteWlucHV0JykuZm9jdXMoKSkgLG1zZWNcblxuXG5cbiMgcXVpY2sgYW5kIGRpcnR5IGZpeCBmb3IgYmFjayBidXR0b24gaW4gYnJvd3Nlclxud2luZG93Lm9uaGFzaGNoYW5nZSA9IChlKSAtPlxuICBoPXdpbmRvdy5sb2NhdGlvbi5oYXNoXG4gICNjb25zb2xlLmxvZyBcIm9uSGFzaENoYW5nZSAje2h9XCJcbiAgI2NvbnNvbGUubG9nIGVcbiAgaWYgbm90IGhcbiAgICBHT1ZXSUtJLnNob3dfc2VhcmNoX3BhZ2UoKVxuXG4jID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4jdGVtcGxhdGVzLmxvYWRfdGVtcGxhdGUgXCJ0YWJzXCIsIFwiY29uZmlnL3RhYmxheW91dC5qc29uXCJcbnRlbXBsYXRlcy5sb2FkX2Z1c2lvbl90ZW1wbGF0ZSBcInRhYnNcIiwgXCJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9mdXNpb250YWJsZXMvdjIvcXVlcnk/c3FsPVNFTEVDVCUyMColMjBGUk9NJTIwMXoyb1hRRVlRM3AyT29NSThWNWdLZ0hXQjVUejk5MEJyUTF4YzF0Vm8ma2V5PUFJemFTeUNYRFF5TURwR0EyZzNRanV2NENEdjd6UmotaXg0SVFKQVwiXG5cbmJ1aWxkX3NlbGVjdG9yKCcuc3RhdGUtY29udGFpbmVyJyAsICdTdGF0ZS4uJyAsICd7XCJkaXN0aW5jdFwiOiBcImdvdnNcIixcImtleVwiOlwic3RhdGVcIn0nICwgJ3N0YXRlX2ZpbHRlcicpXG5idWlsZF9zZWxlY3RvcignLmdvdi10eXBlLWNvbnRhaW5lcicgLCAndHlwZSBvZiBnb3Zlcm5tZW50Li4nICwgJ3tcImRpc3RpbmN0XCI6IFwiZ292c1wiLFwia2V5XCI6XCJnb3ZfdHlwZVwifScgLCAnZ292X3R5cGVfZmlsdGVyJylcblxuYWRqdXN0X3R5cGVhaGVhZF93aWR0aCgpXG5zdGFydF9hZGp1c3RpbmdfdHlwZWFoZWFkX3dpZHRoKClcblxuJCgnI2J0bkJhY2tUb1NlYXJjaCcpLmNsaWNrIChlKS0+XG4gIGUucHJldmVudERlZmF1bHQoKVxuICBHT1ZXSUtJLnNob3dfc2VhcmNoX3BhZ2UoKVxuXG4jZm9jdXNfc2VhcmNoX2ZpZWxkIDUwMFxuXG5cblxubGl2ZXJlbG9hZCBcIjkwOTBcIlxuXG4iLCJcblxuXG4jIFRha2VzIGFuIGFycmF5IG9mIGRvY3MgdG8gc2VhcmNoIGluLlxuIyBSZXR1cm5zIGEgZnVuY3Rpb25zIHRoYXQgdGFrZXMgMiBwYXJhbXMgXG4jIHEgLSBxdWVyeSBzdHJpbmcgYW5kIFxuIyBjYiAtIGNhbGxiYWNrIHRoYXQgd2lsbCBiZSBjYWxsZWQgd2hlbiB0aGUgc2VhcmNoIGlzIGRvbmUuXG4jIGNiIHJldHVybnMgYW4gYXJyYXkgb2YgbWF0Y2hpbmcgZG9jdW1lbnRzLlxuIyBtdW1faXRlbXMgLSBtYXggbnVtYmVyIG9mIGZvdW5kIGl0ZW1zIHRvIHNob3dcblF1ZXJ5TWF0aGVyID0gKGRvY3MsIG51bV9pdGVtcz01KSAtPlxuICAocSwgY2IpIC0+XG4gICAgdGVzdF9zdHJpbmcgPShzLCByZWdzKSAtPlxuICAgICAgKGlmIG5vdCByLnRlc3QocykgdGhlbiByZXR1cm4gZmFsc2UpICBmb3IgciBpbiByZWdzXG4gICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgW3dvcmRzLHJlZ3NdID0gZ2V0X3dvcmRzX3JlZ3MgcVxuICAgIG1hdGNoZXMgPSBbXVxuICAgICMgaXRlcmF0ZSB0aHJvdWdoIHRoZSBwb29sIG9mIGRvY3MgYW5kIGZvciBhbnkgc3RyaW5nIHRoYXRcbiAgICAjIGNvbnRhaW5zIHRoZSBzdWJzdHJpbmcgYHFgLCBhZGQgaXQgdG8gdGhlIGBtYXRjaGVzYCBhcnJheVxuXG4gICAgZm9yIGQgaW4gZG9jc1xuICAgICAgaWYgbWF0Y2hlcy5sZW5ndGggPj0gbnVtX2l0ZW1zIHRoZW4gYnJlYWtcbiAgICAgIGlmIEdPVldJS0kuc3RhdGVfZmlsdGVyIGFuZCBkLnN0YXRlIGlzbnQgR09WV0lLSS5zdGF0ZV9maWx0ZXIgdGhlbiBjb250aW51ZVxuICAgICAgaWYgR09WV0lLSS5nb3ZfdHlwZV9maWx0ZXIgYW5kIGQuZ292X3R5cGUgaXNudCBHT1ZXSUtJLmdvdl90eXBlX2ZpbHRlciB0aGVuIGNvbnRpbnVlXG5cbiAgICAgIGlmIHRlc3Rfc3RyaW5nKGQuZ292X25hbWUsIHJlZ3MpIFxuICAgICAgICBtYXRjaGVzLnB1c2ggJC5leHRlbmQoe30sIGQpXG4gICAgICAjaWYgdGVzdF9zdHJpbmcoXCIje2QuZ292X25hbWV9ICN7ZC5zdGF0ZX0gI3tkLmdvdl90eXBlfSAje2QuaW5jX2lkfVwiLCByZWdzKSB0aGVuIG1hdGNoZXMucHVzaCAkLmV4dGVuZCh7fSwgZClcbiAgICBcbiAgICBzZWxlY3RfdGV4dCBtYXRjaGVzLCB3b3JkcywgcmVnc1xuICAgIGNiIG1hdGNoZXNcbiAgICByZXR1cm5cbiBcblxuIyBpbnNlcnRzIDxzdHJvbmc+IGVsZW1lbnRzZSBpbiBhcnJheVxuc2VsZWN0X3RleHQgPSAoY2xvbmVzLHdvcmRzLHJlZ3MpIC0+XG4gIGZvciBkIGluIGNsb25lc1xuICAgIGQuZ292X25hbWU9c3Ryb25naWZ5KGQuZ292X25hbWUsIHdvcmRzLCByZWdzKVxuICAgICNkLnN0YXRlPXN0cm9uZ2lmeShkLnN0YXRlLCB3b3JkcywgcmVncylcbiAgICAjZC5nb3ZfdHlwZT1zdHJvbmdpZnkoZC5nb3ZfdHlwZSwgd29yZHMsIHJlZ3MpXG4gIFxuICByZXR1cm4gY2xvbmVzXG5cblxuXG4jIGluc2VydHMgPHN0cm9uZz4gZWxlbWVudHNlXG5zdHJvbmdpZnkgPSAocywgd29yZHMsIHJlZ3MpIC0+XG4gIHJlZ3MuZm9yRWFjaCAocixpKSAtPlxuICAgIHMgPSBzLnJlcGxhY2UgciwgXCI8Yj4je3dvcmRzW2ldfTwvYj5cIlxuICByZXR1cm4gc1xuXG4jIHJlbW92ZXMgPD4gdGFncyBmcm9tIGEgc3RyaW5nXG5zdHJpcCA9IChzKSAtPlxuICBzLnJlcGxhY2UoLzxbXjw+XSo+L2csJycpXG5cblxuIyBhbGwgdGlybXMgc3BhY2VzIGZyb20gYm90aCBzaWRlcyBhbmQgbWFrZSBjb250cmFjdHMgc2VxdWVuY2VzIG9mIHNwYWNlcyB0byAxXG5mdWxsX3RyaW0gPSAocykgLT5cbiAgc3M9cy50cmltKCcnK3MpXG4gIHNzPXNzLnJlcGxhY2UoLyArL2csJyAnKVxuXG4jIHJldHVybnMgYW4gYXJyYXkgb2Ygd29yZHMgaW4gYSBzdHJpbmdcbmdldF93b3JkcyA9IChzdHIpIC0+XG4gIGZ1bGxfdHJpbShzdHIpLnNwbGl0KCcgJylcblxuXG5nZXRfd29yZHNfcmVncyA9IChzdHIpIC0+XG4gIHdvcmRzID0gZ2V0X3dvcmRzIHN0clxuICByZWdzID0gd29yZHMubWFwICh3KS0+IG5ldyBSZWdFeHAoXCIje3d9XCIsJ2knKVxuICBbd29yZHMscmVnc11cblxuXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXJ5TWF0aGVyXG5cbiIsIlxuIyMjXG4jIGZpbGU6IHRlbXBsYXRlczIuY29mZmVlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiNcbiMgQ2xhc3MgdG8gbWFuYWdlIHRlbXBsYXRlcyBhbmQgcmVuZGVyIGRhdGEgb24gaHRtbCBwYWdlLlxuI1xuIyBUaGUgbWFpbiBtZXRob2QgOiByZW5kZXIoZGF0YSksIGdldF9odG1sKGRhdGEpXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyMjXG5cblxuXG4jIExPQUQgRklFTEQgTkFNRVNcbmZpZWxkTmFtZXMgPSB7fVxuZmllbGROYW1lc0hlbHAgPSB7fVxuXG5cbnJlbmRlcl9maWVsZF92YWx1ZSA9IChuLG1hc2ssZGF0YSkgLT5cbiAgdj1kYXRhW25dXG4gIGlmIG5vdCBkYXRhW25dXG4gICAgcmV0dXJuICcnXG5cbiAgaWYgbiA9PSBcIndlYl9zaXRlXCJcbiAgICByZXR1cm4gXCI8YSB0YXJnZXQ9J19ibGFuaycgaHJlZj0nI3t2fSc+I3t2fTwvYT5cIlxuICBlbHNlXG4gICAgaWYgJycgIT0gbWFza1xuICAgICAgaWYgZGF0YVtuKydfcmFuayddIGFuZCBkYXRhLm1heF9yYW5rcyBhbmQgZGF0YS5tYXhfcmFua3NbbisnX21heF9yYW5rJ11cbiAgICAgICAgdiA9IG51bWVyYWwodikuZm9ybWF0KG1hc2spXG4gICAgICAgIHJldHVybiBcIiN7dn0gPHNwYW4gY2xhc3M9J3JhbmsnPigje2RhdGFbbisnX3JhbmsnXX0gb2YgI3tkYXRhLm1heF9yYW5rc1tuKydfbWF4X3JhbmsnXX0pPC9zcGFuPlwiXG4gICAgICByZXR1cm4gbnVtZXJhbCh2KS5mb3JtYXQobWFzaylcbiAgICBlbHNlXG4gICAgICBpZiB2Lmxlbmd0aCA+IDIwIGFuZFxuICAgICAgbiA9PSBcIm9wZW5fZW5yb2xsbWVudF9zY2hvb2xzXCJcbiAgICAgIHRoZW4gdiA9IHYuc3Vic3RyaW5nKDAsIDE5KSArIFwiPGRpdiBzdHlsZT0nZGlzcGxheTppbmxpbmU7Y29sb3I6IzA3NGQ3MScgIHRpdGxlPScje3Z9Jz4maGVsbGlwOzwvZGl2PlwiXG4gICAgICBlbHNlXG4gICAgICAgIGlmIHYubGVuZ3RoID4gMjFcbiAgICAgICAgdGhlbiB2ID0gdi5zdWJzdHJpbmcoMCwgMjEpXG4gICAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIHZcblxuXG5yZW5kZXJfZmllbGRfbmFtZV9oZWxwID0gKGZOYW1lKSAtPlxuICAjaWYgZmllbGROYW1lc0hlbHBbZk5hbWVdXG4gICAgcmV0dXJuIGZpZWxkTmFtZXNIZWxwW2ZOYW1lXVxuXG5yZW5kZXJfZmllbGRfbmFtZSA9IChmTmFtZSkgLT5cbiAgaWYgZmllbGROYW1lc1tmTmFtZV0/XG4gICAgcmV0dXJuIGZpZWxkTmFtZXNbZk5hbWVdXG5cbiAgcyA9IGZOYW1lLnJlcGxhY2UoL18vZyxcIiBcIilcbiAgcyA9IHMuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzLnN1YnN0cmluZygxKVxuICByZXR1cm4gc1xuXG5cbnJlbmRlcl9maWVsZCA9IChmTmFtZSxkYXRhKS0+XG4gIGlmIFwiX1wiID09IHN1YnN0ciBmTmFtZSwgMCwgMVxuICAgIFwiXCJcIlxuICAgIDxkaXY+XG4gICAgICAgIDxzcGFuIGNsYXNzPSdmLW5hbScgPiN7cmVuZGVyX2ZpZWxkX25hbWUgZk5hbWV9PC9zcGFuPlxuICAgICAgICA8c3BhbiBjbGFzcz0nZi12YWwnPiZuYnNwOzwvc3Bhbj5cbiAgICA8L2Rpdj5cbiAgICBcIlwiXCJcbiAgZWxzZVxuICAgIHJldHVybiAnJyB1bmxlc3MgZlZhbHVlID0gZGF0YVtmTmFtZV1cbiAgICBcIlwiXCJcbiAgICA8ZGl2PlxuICAgICAgICA8c3BhbiBjbGFzcz0nZi1uYW0nICA+I3tyZW5kZXJfZmllbGRfbmFtZSBmTmFtZX08ZGl2Pjwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3M9J2YtdmFsJz4je3JlbmRlcl9maWVsZF92YWx1ZShmTmFtZSxkYXRhKX08L3NwYW4+XG4gICAgPC9kaXY+XG4gICAgXCJcIlwiXG5cbnJlbmRlcl9zdWJoZWFkaW5nID0gKGZOYW1lLCBtYXNrLCBub3RGaXJzdCktPlxuICBzID0gJydcbiAgZk5hbWUgPSByZW5kZXJfZmllbGRfbmFtZSBmTmFtZVxuICBpZiBtYXNrID09IFwiaGVhZGluZ1wiXG4gICAgaWYgbm90Rmlyc3QgIT0gMFxuICAgICAgcyArPSBcIjxici8+XCJcbiAgICBzICs9IFwiPGRpdj48c3BhbiBjbGFzcz0nZi1uYW0nPiN7Zk5hbWV9PC9zcGFuPjxzcGFuIGNsYXNzPSdmLXZhbCc+IDwvc3Bhbj48L2Rpdj5cIlxuICByZXR1cm4gc1xuXG5yZW5kZXJfZmllbGRzID0gKGZpZWxkcyxkYXRhLHRlbXBsYXRlKS0+XG4gIGggPSAnJ1xuICBmb3IgZmllbGQsaSBpbiBmaWVsZHNcbiAgICBpZiAodHlwZW9mIGZpZWxkIGlzIFwib2JqZWN0XCIpXG4gICAgICBpZiBmaWVsZC5tYXNrID09IFwiaGVhZGluZ1wiXG4gICAgICAgIGggKz0gcmVuZGVyX3N1YmhlYWRpbmcoZmllbGQubmFtZSwgZmllbGQubWFzaywgaSlcbiAgICAgICAgZlZhbHVlID0gJydcbiAgICAgIGVsc2VcbiAgICAgICAgZlZhbHVlID0gcmVuZGVyX2ZpZWxkX3ZhbHVlIGZpZWxkLm5hbWUsIGZpZWxkLm1hc2ssIGRhdGFcbiAgICAgICAgaWYgKCcnICE9IGZWYWx1ZSBhbmQgZlZhbHVlICE9ICcwJylcbiAgICAgICAgICBmTmFtZSA9IHJlbmRlcl9maWVsZF9uYW1lIGZpZWxkLm5hbWVcbiAgICAgICAgICBmTmFtZUhlbHAgPSByZW5kZXJfZmllbGRfbmFtZV9oZWxwIGZpZWxkLm5hbWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGZWYWx1ZSA9ICcnXG5cbiAgICBlbHNlXG4gICAgICBmVmFsdWUgPSByZW5kZXJfZmllbGRfdmFsdWUgZmllbGQsICcnLCBkYXRhXG4gICAgICBpZiAoJycgIT0gZlZhbHVlKVxuICAgICAgICBmTmFtZSA9IHJlbmRlcl9maWVsZF9uYW1lIGZpZWxkXG4gICAgICAgIGZOYW1lSGVscCA9IHJlbmRlcl9maWVsZF9uYW1lX2hlbHAgZk5hbWVcbiAgICBpZiAoJycgIT0gZlZhbHVlKVxuICAgICAgaCArPSB0ZW1wbGF0ZShuYW1lOiBmTmFtZSwgdmFsdWU6IGZWYWx1ZSwgaGVscDogZk5hbWVIZWxwKVxuICByZXR1cm4gaFxuXG5yZW5kZXJfZmluYW5jaWFsX2ZpZWxkcyA9IChkYXRhLHRlbXBsYXRlKS0+XG4gIGggPSAnJ1xuICBtYXNrID0gJzAsMCdcbiAgY2F0ZWdvcnkgPSAnJ1xuICBpc19maXJzdF9yb3cgPSBmYWxzZVxuICBmb3IgZmllbGQgaW4gZGF0YVxuICAgIGlmIGNhdGVnb3J5ICE9IGZpZWxkLmNhdGVnb3J5X25hbWVcbiAgICAgIGNhdGVnb3J5ID0gZmllbGQuY2F0ZWdvcnlfbmFtZVxuICAgICAgaWYgY2F0ZWdvcnkgPT0gJ092ZXJ2aWV3J1xuICAgICAgICBoICs9IHRlbXBsYXRlKG5hbWU6IFwiPGI+XCIgKyBjYXRlZ29yeSArIFwiPC9iPlwiLCBnZW5mdW5kOiAnJywgb3RoZXJmdW5kczogJycsIHRvdGFsZnVuZHM6ICcnKVxuICAgICAgZWxzZSBpZiBjYXRlZ29yeSA9PSAnUmV2ZW51ZXMnXG4gICAgICAgIGggKz0gJzwvYnI+J1xuICAgICAgICBoICs9IFwiPGI+XCIgKyB0ZW1wbGF0ZShuYW1lOiBjYXRlZ29yeSwgZ2VuZnVuZDogXCJHZW5lcmFsIEZ1bmRcIiwgb3RoZXJmdW5kczogXCJPdGhlciBGdW5kc1wiLCB0b3RhbGZ1bmRzOiBcIlRvdGFsIEdvdi4gRnVuZHNcIikgKyBcIjwvYj5cIlxuICAgICAgICBpc19maXJzdF9yb3cgPSB0cnVlXG4gICAgICBlbHNlXG4gICAgICAgIGggKz0gJzwvYnI+J1xuICAgICAgICBoICs9IHRlbXBsYXRlKG5hbWU6IFwiPGI+XCIgKyBjYXRlZ29yeSArIFwiPC9iPlwiLCBnZW5mdW5kOiAnJywgb3RoZXJmdW5kczogJycsIHRvdGFsZnVuZHM6ICcnKVxuICAgICAgICBpc19maXJzdF9yb3cgPSB0cnVlXG5cbiAgICBpZiBmaWVsZC5jYXB0aW9uID09ICdHZW5lcmFsIEZ1bmQgQmFsYW5jZScgb3IgZmllbGQuY2FwdGlvbiA9PSAnTG9uZyBUZXJtIERlYnQnXG4gICAgICBoICs9IHRlbXBsYXRlKG5hbWU6IGZpZWxkLmNhcHRpb24sIGdlbmZ1bmQ6IGN1cnJlbmN5KGZpZWxkLmdlbmZ1bmQsIG1hc2ssICc8c3BhbiBjbGFzcz1cImN1cnJlbmN5LXNpZ25cIj4kPC9zcGFuPicpKVxuICAgIGVsc2UgaWYgZmllbGQuY2FwdGlvbiBpbiBbJ1RvdGFsIFJldmVudWVzJywgJ1RvdGFsIEV4cGVuZGl0dXJlcycsICdTdXJwbHVzIC8gKERlZmljaXQpJ10gb3IgaXNfZmlyc3Rfcm93XG4gICAgICBoICs9IHRlbXBsYXRlKG5hbWU6IGZpZWxkLmNhcHRpb24sIGdlbmZ1bmQ6IGN1cnJlbmN5KGZpZWxkLmdlbmZ1bmQsIG1hc2ssICc8c3BhbiBjbGFzcz1cImN1cnJlbmN5LXNpZ25cIj4kPC9zcGFuPicpLCBvdGhlcmZ1bmRzOiBjdXJyZW5jeShmaWVsZC5vdGhlcmZ1bmRzLCBtYXNrLCAnPHNwYW4gY2xhc3M9XCJjdXJyZW5jeS1zaWduXCI+JDwvc3Bhbj4nKSwgdG90YWxmdW5kczogY3VycmVuY3koZmllbGQudG90YWxmdW5kcywgbWFzaywgJzxzcGFuIGNsYXNzPVwiY3VycmVuY3ktc2lnblwiPiQ8L3NwYW4+JykpXG4gICAgICBpc19maXJzdF9yb3cgPSBmYWxzZVxuICAgIGVsc2VcbiAgICAgIGggKz0gdGVtcGxhdGUobmFtZTogZmllbGQuY2FwdGlvbiwgZ2VuZnVuZDogY3VycmVuY3koZmllbGQuZ2VuZnVuZCwgbWFzayksIG90aGVyZnVuZHM6IGN1cnJlbmN5KGZpZWxkLm90aGVyZnVuZHMsIG1hc2spLCB0b3RhbGZ1bmRzOiBjdXJyZW5jeShmaWVsZC50b3RhbGZ1bmRzLCBtYXNrKSlcbiAgcmV0dXJuIGhcblxudW5kZXIgPSAocykgLT4gcy5yZXBsYWNlKC9bXFxzXFwrXFwtXS9nLCAnXycpXG5cbnRvVGl0bGVDYXNlID0gKHN0cikgLT5cbiAgc3RyLnJlcGxhY2UgL1xcd1xcUyovZywgKHR4dCkgLT5cbiAgICB0eHQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB0eHQuc3Vic3RyKDEpLnRvTG93ZXJDYXNlKClcblxuY3VycmVuY3kgPSAobiwgbWFzaywgc2lnbiA9ICcnKSAtPlxuICAgIG4gPSBudW1lcmFsKG4pXG4gICAgaWYgbiA8IDBcbiAgICAgICAgcyA9IG4uZm9ybWF0KG1hc2spLnRvU3RyaW5nKClcbiAgICAgICAgcyA9IHMucmVwbGFjZSgvLS9nLCAnJylcbiAgICAgICAgcmV0dXJuIFwiKCN7c2lnbn0jeyc8c3BhbiBjbGFzcz1cImZpbi12YWxcIj4nK3MrJzwvc3Bhbj4nfSlcIlxuXG4gICAgbiA9IG4uZm9ybWF0KG1hc2spXG4gICAgcmV0dXJuIFwiI3tzaWdufSN7JzxzcGFuIGNsYXNzPVwiZmluLXZhbFwiPicrbisnPC9zcGFuPid9XCJcblxucmVuZGVyX3RhYnMgPSAoaW5pdGlhbF9sYXlvdXQsIGRhdGEsIHRhYnNldCwgcGFyZW50KSAtPlxuICAjbGF5b3V0ID0gYWRkX290aGVyX3RhYl90b19sYXlvdXQgaW5pdGlhbF9sYXlvdXQsIGRhdGFcbiAgbGF5b3V0ID0gaW5pdGlhbF9sYXlvdXRcbiAgdGVtcGxhdGVzID0gcGFyZW50LnRlbXBsYXRlc1xuICBwbG90X2hhbmRsZXMgPSB7fVxuXG4gIGxheW91dF9kYXRhID1cbiAgICB0aXRsZTogZGF0YS5nb3ZfbmFtZVxuICAgIHdpa2lwZWRpYV9wYWdlX2V4aXN0czogZGF0YS53aWtpcGVkaWFfcGFnZV9leGlzdHNcbiAgICB3aWtpcGVkaWFfcGFnZV9uYW1lOiAgZGF0YS53aWtpcGVkaWFfcGFnZV9uYW1lXG4gICAgdHJhbnNwYXJlbnRfY2FsaWZvcm5pYV9wYWdlX25hbWU6IGRhdGEudHJhbnNwYXJlbnRfY2FsaWZvcm5pYV9wYWdlX25hbWVcbiAgICBsYXRlc3RfYXVkaXRfdXJsOiBkYXRhLmxhdGVzdF9hdWRpdF91cmxcbiAgICB0YWJzOiBbXVxuICAgIHRhYmNvbnRlbnQ6ICcnXG5cbiAgZm9yIHRhYixpIGluIGxheW91dFxuICAgIGxheW91dF9kYXRhLnRhYnMucHVzaFxuICAgICAgdGFiaWQ6IHVuZGVyKHRhYi5uYW1lKSxcbiAgICAgIHRhYm5hbWU6IHRhYi5uYW1lLFxuICAgICAgYWN0aXZlOiAoaWYgaT4wIHRoZW4gJycgZWxzZSAnYWN0aXZlJylcblxuICBmb3IgdGFiLGkgaW4gbGF5b3V0XG4gICAgZGV0YWlsX2RhdGEgPVxuICAgICAgdGFiaWQ6IHVuZGVyKHRhYi5uYW1lKSxcbiAgICAgIHRhYm5hbWU6IHRhYi5uYW1lLFxuICAgICAgYWN0aXZlOiAoaWYgaT4wIHRoZW4gJycgZWxzZSAnYWN0aXZlJylcbiAgICAgIHRhYmNvbnRlbnQ6ICcnXG4gICAgc3dpdGNoIHRhYi5uYW1lXG4gICAgICB3aGVuICdPdmVydmlldyArIEVsZWN0ZWQgT2ZmaWNpYWxzJ1xuICAgICAgICBkZXRhaWxfZGF0YS50YWJjb250ZW50ICs9IHJlbmRlcl9maWVsZHMgdGFiLmZpZWxkcywgZGF0YSwgdGVtcGxhdGVzWyd0YWJkZXRhaWwtbmFtZXZhbHVlLXRlbXBsYXRlJ11cbiAgICAgICAgZm9yIG9mZmljaWFsLGkgaW4gZGF0YS5lbGVjdGVkX29mZmljaWFscy5yZWNvcmRcbiAgICAgICAgICBvZmZpY2lhbF9kYXRhID1cbiAgICAgICAgICAgIHRpdGxlOiBpZiAnJyAhPSBvZmZpY2lhbC50aXRsZSB0aGVuIFwiVGl0bGU6IFwiICsgb2ZmaWNpYWwudGl0bGVcbiAgICAgICAgICAgIG5hbWU6IGlmICcnICE9IG9mZmljaWFsLmZ1bGxfbmFtZSB0aGVuIFwiTmFtZTogXCIgKyBvZmZpY2lhbC5mdWxsX25hbWVcbiAgICAgICAgICAgIGVtYWlsOiBpZiBudWxsICE9IG9mZmljaWFsLmVtYWlsX2FkZHJlc3MgdGhlbiBcIkVtYWlsOiBcIiArIG9mZmljaWFsLmVtYWlsX2FkZHJlc3NcbiAgICAgICAgICAgIHRlbGVwaG9uZW51bWJlcjogaWYgbnVsbCAhPSBvZmZpY2lhbC50ZWxlcGhvbmVfbnVtYmVyIGFuZCB1bmRlZmluZWQgIT0gb2ZmaWNpYWwudGVsZXBob25lX251bWJlciB0aGVuIFwiVGVsZXBob25lIE51bWJlcjogXCIgKyBvZmZpY2lhbC50ZWxlcGhvbmVfbnVtYmVyXG4gICAgICAgICAgICB0ZXJtZXhwaXJlczogaWYgbnVsbCAhPSBvZmZpY2lhbC50ZXJtX2V4cGlyZXMgdGhlbiBcIlRlcm0gRXhwaXJlczogXCIgKyBvZmZpY2lhbC50ZXJtX2V4cGlyZXNcblxuICAgICAgICAgIGlmICcnICE9IG9mZmljaWFsLnBob3RvX3VybCBhbmQgb2ZmaWNpYWwucGhvdG9fdXJsICE9IG51bGwgdGhlbiBvZmZpY2lhbF9kYXRhLmltYWdlID0gICc8aW1nIHNyYz1cIicrb2ZmaWNpYWwucGhvdG9fdXJsKydcIiBjbGFzcz1cInBvcnRyYWl0XCIgYWx0PVwiXCIgLz4nXG4gICAgICAgICAgZGV0YWlsX2RhdGEudGFiY29udGVudCArPSB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC1vZmZpY2lhbC10ZW1wbGF0ZSddKG9mZmljaWFsX2RhdGEpXG4gICAgICB3aGVuICdFbXBsb3llZSBDb21wZW5zYXRpb24nXG4gICAgICAgIGggPSAnJ1xuICAgICAgICBoICs9IHJlbmRlcl9maWVsZHMgdGFiLmZpZWxkcywgZGF0YSwgdGVtcGxhdGVzWyd0YWJkZXRhaWwtbmFtZXZhbHVlLXRlbXBsYXRlJ11cbiAgICAgICAgZGV0YWlsX2RhdGEudGFiY29udGVudCArPSB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC1lbXBsb3llZS1jb21wLXRlbXBsYXRlJ10oY29udGVudDogaClcbiAgICAgICAgaWYgbm90IHBsb3RfaGFuZGxlc1snbWVkaWFuLWNvbXAtZ3JhcGgnXVxuICAgICAgICAgIGdyYXBoID0gdHJ1ZVxuICAgICAgICAgIGlmIGRhdGFbJ21lZGlhbl9zYWxhcnlfcGVyX2Z1bGxfdGltZV9lbXAnXSA9PSAwXG4gICAgICAgICAgICBncmFwaCA9IGZhbHNlXG4gICAgICAgICAgaWYgZGF0YVsnbWVkaWFuX2JlbmVmaXRzX3Blcl9mdF9lbXAnXSA9PSAwXG4gICAgICAgICAgICBncmFwaCA9IGZhbHNlXG4gICAgICAgICAgaWYgZGF0YVsnbWVkaWFuX3dhZ2VzX2dlbmVyYWxfcHVibGljJ10gPT0gMFxuICAgICAgICAgICAgZ3JhcGggPSBmYWxzZVxuICAgICAgICAgIGlmIGRhdGFbJ21lZGlhbl9iZW5lZml0c19nZW5lcmFsX3B1YmxpYyddID09IDBcbiAgICAgICAgICAgIGdyYXBoID0gZmFsc2VcbiAgICAgICAgICBkcmF3Q2hhcnQgPSAoKSAtPlxuICAgICAgICAgICAgc2V0VGltZW91dCAoIC0+XG4gICAgICAgICAgICAgIHZpc19kYXRhID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLkRhdGFUYWJsZSgpXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnc3RyaW5nJywgJ01lZGlhbiBDb21wZW5zYXRpb24nXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnbnVtYmVyJywgJ1dhZ2VzJ1xuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRDb2x1bW4gJ251bWJlcicsICdCZW5zLidcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkUm93cyBbXG4gICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgdG9UaXRsZUNhc2UgZGF0YS5nb3ZfbmFtZSArICdcXG4gRW1wbG95ZWVzJ1xuICAgICAgICAgICAgICAgICAgZGF0YVsnbWVkaWFuX3NhbGFyeV9wZXJfZnVsbF90aW1lX2VtcCddXG4gICAgICAgICAgICAgICAgICBkYXRhWydtZWRpYW5fYmVuZWZpdHNfcGVyX2Z0X2VtcCddXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICdBbGwgXFxuJyArIHRvVGl0bGVDYXNlIGRhdGEuZ292X25hbWUgKyAnIFxcbiBSZXNpZGVudHMnXG4gICAgICAgICAgICAgICAgICBkYXRhWydtZWRpYW5fd2FnZXNfZ2VuZXJhbF9wdWJsaWMnXVxuICAgICAgICAgICAgICAgICAgZGF0YVsnbWVkaWFuX2JlbmVmaXRzX2dlbmVyYWxfcHVibGljJ11cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgZm9ybWF0dGVyID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLk51bWJlckZvcm1hdChncm91cGluZ1N5bWJvbDogJywnICwgZnJhY3Rpb25EaWdpdHM6ICcwJylcbiAgICAgICAgICAgICAgZm9ybWF0dGVyLmZvcm1hdCh2aXNfZGF0YSwgMSk7XG4gICAgICAgICAgICAgIGZvcm1hdHRlci5mb3JtYXQodmlzX2RhdGEsIDIpO1xuICAgICAgICAgICAgICBvcHRpb25zID1cbiAgICAgICAgICAgICAgICAndGl0bGUnOidNZWRpYW4gVG90YWwgQ29tcGVuc2F0aW9uIC0gRnVsbCBUaW1lIFdvcmtlcnM6IFxcbiBHb3Zlcm5tZW50IHZzLiBQcml2YXRlIFNlY3RvcidcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAzNDBcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogMzAwXG4gICAgICAgICAgICAgICAgJ2lzU3RhY2tlZCc6ICd0cnVlJ1xuICAgICAgICAgICAgICAgICdjb2xvcnMnOiBbJyMwMDVjZTYnLCAnIzAwOTkzMyddXG4gICAgICAgICAgICAgIGNoYXJ0ID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLkNvbHVtbkNoYXJ0IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkICdtZWRpYW4tY29tcC1ncmFwaCdcbiAgICAgICAgICAgICAgY2hhcnQuZHJhdyB2aXNfZGF0YSwgb3B0aW9uc1xuICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICksIDEwMDBcbiAgICAgICAgICBpZiBncmFwaFxuICAgICAgICAgICAgZ29vZ2xlLmxvYWQgJ3Zpc3VhbGl6YXRpb24nLCAnMS4wJyxcbiAgICAgICAgICAgICdjYWxsYmFjaycgOiBkcmF3Q2hhcnQoKVxuICAgICAgICAgICAgJ3BhY2thZ2VzJyA6J2NvcmVjaGFydCdcbiAgICAgICAgICBwbG90X2hhbmRsZXNbJ21lZGlhbi1jb21wLWdyYXBoJ10gPSdtZWRpYW4tY29tcC1ncmFwaCdcbiAgICAgICAgaWYgbm90IHBsb3RfaGFuZGxlc1snbWVkaWFuLXBlbnNpb24tZ3JhcGgnXVxuICAgICAgICAgIGdyYXBoID0gdHJ1ZVxuICAgICAgICAgIGlmIGRhdGFbJ21lZGlhbl9wZW5zaW9uXzMwX3llYXJfcmV0aXJlZSddID09IDBcbiAgICAgICAgICAgIGdyYXBoID0gZmFsc2VcbiAgICAgICAgICBkcmF3Q2hhcnQgPSAoKSAtPlxuICAgICAgICAgICAgc2V0VGltZW91dCAoIC0+XG4gICAgICAgICAgICAgIHZpc19kYXRhID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLkRhdGFUYWJsZSgpXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnc3RyaW5nJywgJ01lZGlhbiBQZW5zaW9uJ1xuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRDb2x1bW4gJ251bWJlcicsICdXYWdlcydcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkUm93cyBbXG4gICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgJ1BlbnNpb24gZm9yIFxcbiBSZXRpcmVlIHcvIDMwIFllYXJzJ1xuICAgICAgICAgICAgICAgICAgZGF0YVsnbWVkaWFuX3BlbnNpb25fMzBfeWVhcl9yZXRpcmVlJ11cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgZm9ybWF0dGVyID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLk51bWJlckZvcm1hdChncm91cGluZ1N5bWJvbDogJywnICwgZnJhY3Rpb25EaWdpdHM6ICcwJylcbiAgICAgICAgICAgICAgZm9ybWF0dGVyLmZvcm1hdCh2aXNfZGF0YSwgMSk7XG4gICAgICAgICAgICAgIG9wdGlvbnMgPVxuICAgICAgICAgICAgICAgICd0aXRsZSc6J01lZGlhbiBUb3RhbCBQZW5zaW9uJ1xuICAgICAgICAgICAgICAgICd3aWR0aCc6IDM0MFxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAzMDBcbiAgICAgICAgICAgICAgICAnaXNTdGFja2VkJzogJ3RydWUnXG4gICAgICAgICAgICAgICAgJ2NvbG9ycyc6IFsnIzAwNWNlNicsICcjMDA5OTMzJ11cbiAgICAgICAgICAgICAgICAnY2hhcnRBcmVhLndpZHRoJzogJzUwJSdcbiAgICAgICAgICAgICAgaWYgZ3JhcGhcbiAgICAgICAgICAgICAgICBjaGFydCA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5Db2x1bW5DaGFydCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAnbWVkaWFuLXBlbnNpb24tZ3JhcGgnXG4gICAgICAgICAgICAgICAgY2hhcnQuZHJhdyB2aXNfZGF0YSwgb3B0aW9uc1xuICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICksIDEwMDBcbiAgICAgICAgICBnb29nbGUubG9hZCAndmlzdWFsaXphdGlvbicsICcxLjAnLFxuICAgICAgICAgICdjYWxsYmFjaycgOiBkcmF3Q2hhcnQoKVxuICAgICAgICAgICdwYWNrYWdlcycgOidjb3JlY2hhcnQnXG4gICAgICAgICAgcGxvdF9oYW5kbGVzWydtZWRpYW4tcGVuc2lvbi1ncmFwaCddID0nbWVkaWFuLXBlbnNpb24tZ3JhcGgnXG4gICAgICB3aGVuICdGaW5hbmNpYWwgSGVhbHRoJ1xuICAgICAgICBoID0gJydcbiAgICAgICAgaCArPSByZW5kZXJfZmllbGRzIHRhYi5maWVsZHMsIGRhdGEsIHRlbXBsYXRlc1sndGFiZGV0YWlsLW5hbWV2YWx1ZS10ZW1wbGF0ZSddXG4gICAgICAgIGRldGFpbF9kYXRhLnRhYmNvbnRlbnQgKz0gdGVtcGxhdGVzWyd0YWJkZXRhaWwtZmluYW5jaWFsLWhlYWx0aC10ZW1wbGF0ZSddKGNvbnRlbnQ6IGgpXG4gICAgICAgICNwdWJsaWMgc2FmZXR5IHBpZVxuICAgICAgICBpZiBub3QgcGxvdF9oYW5kbGVzWydwdWJsaWMtc2FmZXR5LXBpZSddIGFuZCBkYXRhWydhbHRfdHlwZSddICE9ICdTY2hvb2wgRGlzdHJpY3QnXG4gICAgICAgICAgZ3JhcGggPSB0cnVlXG4gICAgICAgICAgaWYgZGF0YVsncHVibGljX3NhZmV0eV9leHBfb3Zlcl90b3RfZ292X2Z1bmRfcmV2ZW51ZSddID09IDBcbiAgICAgICAgICAgIGdyYXBoID0gZmFsc2VcbiAgICAgICAgICBkcmF3Q2hhcnQgPSAoKSAtPlxuICAgICAgICAgICAgc2V0VGltZW91dCAoIC0+XG4gICAgICAgICAgICAgIHZpc19kYXRhID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLkRhdGFUYWJsZSgpXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnc3RyaW5nJywgJ1B1YmxpYyBTYWZldHkgRXhwZW5zZSdcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdudW1iZXInLCAnVG90YWwnXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZFJvd3MgW1xuICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICdQdWJsaWMgU2FmZXR5IEV4cCdcbiAgICAgICAgICAgICAgICAgIDEgLSBkYXRhWydwdWJsaWNfc2FmZXR5X2V4cF9vdmVyX3RvdF9nb3ZfZnVuZF9yZXZlbnVlJ11cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgJ090aGVyJ1xuICAgICAgICAgICAgICAgICAgZGF0YVsncHVibGljX3NhZmV0eV9leHBfb3Zlcl90b3RfZ292X2Z1bmRfcmV2ZW51ZSddXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIG9wdGlvbnMgPVxuICAgICAgICAgICAgICAgICd0aXRsZSc6J1B1YmxpYyBzYWZldHkgZXhwZW5zZSdcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAzNDBcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogMzAwXG4gICAgICAgICAgICAgICAgJ2lzM0QnIDogJ3RydWUnXG4gICAgICAgICAgICAgICAgJ2NvbG9ycyc6IFsnIzAwNWNlNicsICcjMDA5OTMzJ11cbiAgICAgICAgICAgICAgICAnc2xpY2VzJzogeyAxOiB7b2Zmc2V0OiAwLjJ9fVxuICAgICAgICAgICAgICAgICdwaWVTdGFydEFuZ2xlJzogNDVcbiAgICAgICAgICAgICAgY2hhcnQgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uUGllQ2hhcnQgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgJ3B1YmxpYy1zYWZldHktcGllJ1xuICAgICAgICAgICAgICBjaGFydC5kcmF3IHZpc19kYXRhLCBvcHRpb25zXG4gICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgKSwgMTAwMFxuICAgICAgICAgIGlmIGdyYXBoXG4gICAgICAgICAgICBnb29nbGUubG9hZCAndmlzdWFsaXphdGlvbicsICcxLjAnLFxuICAgICAgICAgICAgJ2NhbGxiYWNrJyA6IGRyYXdDaGFydCgpXG4gICAgICAgICAgICAncGFja2FnZXMnIDonY29yZWNoYXJ0J1xuICAgICAgICAgIHBsb3RfaGFuZGxlc1sncHVibGljLXNhZmV0eS1waWUnXSA9J3B1YmxpYy1zYWZldHktcGllJ1xuICAgICAgICAjZmluLWhlYWx0aC1yZXZlbnVlIGdyYXBoXG4gICAgICAgIGlmIG5vdCBwbG90X2hhbmRsZXNbJ2Zpbi1oZWFsdGgtcmV2ZW51ZS1ncmFwaCddIGFuZCBkYXRhWydhbHRfdHlwZSddICE9ICdTY2hvb2wgRGlzdHJpY3QnXG4gICAgICAgICAgZ3JhcGggPSB0cnVlXG4gICAgICAgICAgaWYgZGF0YVsndG90YWxfcmV2ZW51ZV9wZXJfY2FwaXRhJ10gPT0gMFxuICAgICAgICAgICAgZ3JhcGggPSBmYWxzZVxuICAgICAgICAgIGRyYXdDaGFydCA9ICgpIC0+XG4gICAgICAgICAgICBzZXRUaW1lb3V0ICggLT5cbiAgICAgICAgICAgICAgdmlzX2RhdGEgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uRGF0YVRhYmxlKClcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdzdHJpbmcnLCAnUGVyIENhcGl0YSdcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdudW1iZXInLCAnUmV2LidcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkUm93cyBbXG4gICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgJ1RvdGFsIFJldmVudWUgXFxuIFBlciBDYXBpdGEnXG4gICAgICAgICAgICAgICAgICBkYXRhWyd0b3RhbF9yZXZlbnVlX3Blcl9jYXBpdGEnXVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAnTWVkaWFuIFRvdGFsIFxcbiBSZXZlbnVlIFBlciBcXG4gQ2FwaXRhIEZvciBBbGwgQ2l0aWVzJ1xuICAgICAgICAgICAgICAgICAgNDIwXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIG9wdGlvbnMgPVxuICAgICAgICAgICAgICAgICd0aXRsZSc6J1RvdGFsIFJldmVudWUnXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogMzQwXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6IDMwMFxuICAgICAgICAgICAgICAgICdpc1N0YWNrZWQnOiAndHJ1ZSdcbiAgICAgICAgICAgICAgICAnY29sb3JzJzogWycjMDA1Y2U2JywgJyMwMDk5MzMnXVxuICAgICAgICAgICAgICAgICdjaGFydEFyZWEud2lkdGgnOiAnNTAlJ1xuICAgICAgICAgICAgICBjaGFydCA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5Db2x1bW5DaGFydCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAnZmluLWhlYWx0aC1yZXZlbnVlLWdyYXBoJ1xuICAgICAgICAgICAgICBjaGFydC5kcmF3IHZpc19kYXRhLCBvcHRpb25zXG4gICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgKSwgMTAwMFxuICAgICAgICAgIGlmIGdyYXBoXG4gICAgICAgICAgICBnb29nbGUubG9hZCAndmlzdWFsaXphdGlvbicsICcxLjAnLFxuICAgICAgICAgICAgJ2NhbGxiYWNrJyA6IGRyYXdDaGFydCgpXG4gICAgICAgICAgICAncGFja2FnZXMnIDonY29yZWNoYXJ0J1xuICAgICAgICAgIHBsb3RfaGFuZGxlc1snZmluLWhlYWx0aC1yZXZlbnVlLWdyYXBoJ10gPSdmaW4taGVhbHRoLXJldmVudWUtZ3JhcGgnXG4gICAgICAgICNmaW4taGVhbHRoLWV4cGVuZGl0dXJlcy1ncmFwaFxuICAgICAgICBpZiBub3QgcGxvdF9oYW5kbGVzWydmaW4taGVhbHRoLWV4cGVuZGl0dXJlcy1ncmFwaCddIGFuZCBkYXRhWydhbHRfdHlwZSddICE9ICdTY2hvb2wgRGlzdHJpY3QnXG4gICAgICAgICAgZ3JhcGggPSB0cnVlXG4gICAgICAgICAgaWYgZGF0YVsndG90YWxfZXhwZW5kaXR1cmVzX3Blcl9jYXBpdGEnXSA9PSAwXG4gICAgICAgICAgICBncmFwaCA9IGZhbHNlXG4gICAgICAgICAgZHJhd0NoYXJ0ID0gKCkgLT5cbiAgICAgICAgICAgIHNldFRpbWVvdXQgKCAtPlxuICAgICAgICAgICAgICB2aXNfZGF0YSA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5EYXRhVGFibGUoKVxuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRDb2x1bW4gJ3N0cmluZycsICdQZXIgQ2FwaXRhJ1xuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRDb2x1bW4gJ251bWJlcicsICdFeHAuJ1xuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRSb3dzIFtcbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAnVG90YWwgRXhwZW5kaXR1cmVzIFxcbiBQZXIgQ2FwaXRhJ1xuICAgICAgICAgICAgICAgICAgZGF0YVsndG90YWxfZXhwZW5kaXR1cmVzX3Blcl9jYXBpdGEnXVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAnTWVkaWFuIFRvdGFsIFxcbiBFeHBlbmRpdHVyZXMgXFxuIFBlciBDYXBpdGEgXFxuIEZvciBBbGwgQ2l0aWVzJ1xuICAgICAgICAgICAgICAgICAgNDIwXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIG9wdGlvbnMgPVxuICAgICAgICAgICAgICAgICd0aXRsZSc6J1RvdGFsIEV4cGVuZGl0dXJlcydcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAzNDBcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogMzAwXG4gICAgICAgICAgICAgICAgJ2lzU3RhY2tlZCc6ICd0cnVlJ1xuICAgICAgICAgICAgICAgICdjb2xvcnMnOiBbJyMwMDVjZTYnLCAnIzAwOTkzMyddXG4gICAgICAgICAgICAgICAgJ2NoYXJ0QXJlYS53aWR0aCc6ICc1MCUnXG4gICAgICAgICAgICAgIGlmIGdyYXBoXG4gICAgICAgICAgICAgICAgY2hhcnQgPSBuZXcgZ29vZ2xlLnZpc3VhbGl6YXRpb24uQ29sdW1uQ2hhcnQgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgJ2Zpbi1oZWFsdGgtZXhwZW5kaXR1cmVzLWdyYXBoJ1xuICAgICAgICAgICAgICAgIGNoYXJ0LmRyYXcgdmlzX2RhdGEsIG9wdGlvbnNcbiAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICApLCAxMDAwXG4gICAgICAgICAgZ29vZ2xlLmxvYWQgJ3Zpc3VhbGl6YXRpb24nLCAnMS4wJyxcbiAgICAgICAgICAnY2FsbGJhY2snIDogZHJhd0NoYXJ0KClcbiAgICAgICAgICAncGFja2FnZXMnIDonY29yZWNoYXJ0J1xuICAgICAgICAgIHBsb3RfaGFuZGxlc1snZmluLWhlYWx0aC1leHBlbmRpdHVyZXMtZ3JhcGgnXSA9J2Zpbi1oZWFsdGgtZXhwZW5kaXR1cmVzLWdyYXBoJ1xuICAgICAgd2hlbiAnRmluYW5jaWFsIFN0YXRlbWVudHMnXG4gICAgICAgIGlmIGRhdGEuZmluYW5jaWFsX3N0YXRlbWVudHNcbiAgICAgICAgICBoID0gJydcbiAgICAgICAgICAjaCArPSByZW5kZXJfZmllbGRzIHRhYi5maWVsZHMsIGRhdGEsIHRlbXBsYXRlc1sndGFiZGV0YWlsLW5hbWV2YWx1ZS10ZW1wbGF0ZSddXG4gICAgICAgICAgaCArPSByZW5kZXJfZmluYW5jaWFsX2ZpZWxkcyBkYXRhLmZpbmFuY2lhbF9zdGF0ZW1lbnRzLCB0ZW1wbGF0ZXNbJ3RhYmRldGFpbC1maW5zdGF0ZW1lbnQtdGVtcGxhdGUnXVxuICAgICAgICAgIGRldGFpbF9kYXRhLnRhYmNvbnRlbnQgKz0gdGVtcGxhdGVzWyd0YWJkZXRhaWwtZmluYW5jaWFsLXN0YXRlbWVudHMtdGVtcGxhdGUnXShjb250ZW50OiBoKVxuICAgICAgICAgICN0YWJkZXRhaWwtZmluYW5jaWFsLXN0YXRlbWVudHMtdGVtcGxhdGVcbiAgICAgICAgICBpZiBub3QgcGxvdF9oYW5kbGVzWyd0b3RhbC1yZXZlbnVlLXBpZSddXG4gICAgICAgICAgICBncmFwaCA9IHRydWVcbiAgICAgICAgICAgIGlmIGRhdGEuZmluYW5jaWFsX3N0YXRlbWVudHMubGVuZ3RoID09IDBcbiAgICAgICAgICAgICAgZ3JhcGggPSBmYWxzZVxuICAgICAgICAgICAgZHJhd0NoYXJ0ID0gKCkgLT5cbiAgICAgICAgICAgIHNldFRpbWVvdXQgKCAtPlxuICAgICAgICAgICAgICB2aXNfZGF0YSA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5EYXRhVGFibGUoKVxuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRDb2x1bW4gJ3N0cmluZycsICdUb3RhbCBHb3YuIEV4cGVuZGl0dXJlcydcbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkQ29sdW1uICdudW1iZXInLCAnVG90YWwnXG5cbiAgICAgICAgICAgICAgcm93cyA9IFtdXG4gICAgICAgICAgICAgIGZvciBpdGVtIGluIGRhdGEuZmluYW5jaWFsX3N0YXRlbWVudHNcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyAnQEBAQCcrSlNPTi5zdHJpbmdpZnkgaXRlbVxuICAgICAgICAgICAgICAgIGlmIChpdGVtLmNhdGVnb3J5X25hbWUgaXMgXCJSZXZlbnVlc1wiKSBhbmQgKGl0ZW0uY2FwdGlvbiBpc250IFwiVG90YWwgUmV2ZW51ZXNcIilcblxuICAgICAgICAgICAgICAgICAgciA9IFtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5jYXB0aW9uXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlSW50IGl0ZW0udG90YWxmdW5kc1xuICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgcm93cy5wdXNoKHIpXG5cbiAgICAgICAgICAgICAgdmlzX2RhdGEuYWRkUm93cyByb3dzXG4gICAgICAgICAgICAgIG9wdGlvbnMgPVxuICAgICAgICAgICAgICAgICd0aXRsZSc6J1RvdGFsIFJldmVudWVzJ1xuICAgICAgICAgICAgICAgICd3aWR0aCc6IDQwMFxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAzNTBcbiAgICAgICAgICAgICAgICAncGllU3RhcnRBbmdsZSc6IDYwXG4gICAgICAgICAgICAgICAgJ3NsaWNlVmlzaWJpbGl0eVRocmVzaG9sZCc6IC4wNVxuICAgICAgICAgICAgICAgICdmb3JjZUlGcmFtZSc6IHRydWVcbiAgICAgICAgICAgICAgICAnY2hhcnRBcmVhJzp7XG4gICAgICAgICAgICAgICAgICAgd2lkdGg6JzkwJSdcbiAgICAgICAgICAgICAgICAgICBoZWlnaHQ6Jzc1JSdcbiAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICMnaXMzRCcgOiAndHJ1ZSdcbiAgICAgICAgICAgICAgaWYgZ3JhcGhcbiAgICAgICAgICAgICAgICBjaGFydCA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5QaWVDaGFydCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAndG90YWwtcmV2ZW51ZS1waWUnXG4gICAgICAgICAgICAgICAgY2hhcnQuZHJhdyB2aXNfZGF0YSwgb3B0aW9uc1xuICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICksIDEwMDBcbiAgICAgICAgICBpZiBncmFwaFxuICAgICAgICAgICAgZ29vZ2xlLmxvYWQgJ3Zpc3VhbGl6YXRpb24nLCAnMS4wJyxcbiAgICAgICAgICAgICdjYWxsYmFjaycgOiBkcmF3Q2hhcnQoKVxuICAgICAgICAgICAgJ3BhY2thZ2VzJyA6J2NvcmVjaGFydCdcbiAgICAgICAgICBwbG90X2hhbmRsZXNbJ3RvdGFsLXJldmVudWUtcGllJ10gPSd0b3RhbC1yZXZlbnVlLXBpZSdcbiAgICAgICAgICBpZiBub3QgcGxvdF9oYW5kbGVzWyd0b3RhbC1leHBlbmRpdHVyZXMtcGllJ11cbiAgICAgICAgICAgIGdyYXBoID0gdHJ1ZVxuICAgICAgICAgICAgaWYgZGF0YS5maW5hbmNpYWxfc3RhdGVtZW50cy5sZW5ndGggPT0gMFxuICAgICAgICAgICAgICBncmFwaCA9IGZhbHNlXG4gICAgICAgICAgICBkcmF3Q2hhcnQgPSAoKSAtPlxuICAgICAgICAgICAgc2V0VGltZW91dCAoIC0+XG4gICAgICAgICAgICAgIHZpc19kYXRhID0gbmV3IGdvb2dsZS52aXN1YWxpemF0aW9uLkRhdGFUYWJsZSgpXG4gICAgICAgICAgICAgIHZpc19kYXRhLmFkZENvbHVtbiAnc3RyaW5nJywgJ1RvdGFsIEdvdi4gRXhwZW5kaXR1cmVzJ1xuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRDb2x1bW4gJ251bWJlcicsICdUb3RhbCdcblxuICAgICAgICAgICAgICByb3dzID0gW11cbiAgICAgICAgICAgICAgZm9yIGl0ZW0gaW4gZGF0YS5maW5hbmNpYWxfc3RhdGVtZW50c1xuICAgICAgICAgICAgICAgIGlmIChpdGVtLmNhdGVnb3J5X25hbWUgaXMgXCJFeHBlbmRpdHVyZXNcIikgYW5kIChpdGVtLmNhcHRpb24gaXNudCBcIlRvdGFsIEV4cGVuZGl0dXJlc1wiKVxuXG4gICAgICAgICAgICAgICAgICByID0gW1xuICAgICAgICAgICAgICAgICAgICBpdGVtLmNhcHRpb25cbiAgICAgICAgICAgICAgICAgICAgcGFyc2VJbnQgaXRlbS50b3RhbGZ1bmRzXG4gICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICByb3dzLnB1c2gocilcblxuICAgICAgICAgICAgICB2aXNfZGF0YS5hZGRSb3dzIHJvd3NcbiAgICAgICAgICAgICAgb3B0aW9ucyA9XG4gICAgICAgICAgICAgICAgJ3RpdGxlJzonVG90YWwgRXhwZW5kaXR1cmVzJ1xuICAgICAgICAgICAgICAgICd3aWR0aCc6IDQwMFxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAzNTBcbiAgICAgICAgICAgICAgICAncGllU3RhcnRBbmdsZSc6IDYwXG4gICAgICAgICAgICAgICAgJ3NsaWNlVmlzaWJpbGl0eVRocmVzaG9sZCc6IC4wNVxuICAgICAgICAgICAgICAgICdmb3JjZUlGcmFtZSc6IHRydWVcbiAgICAgICAgICAgICAgICAnY2hhcnRBcmVhJzp7XG4gICAgICAgICAgICAgICAgICAgd2lkdGg6JzkwJSdcbiAgICAgICAgICAgICAgICAgICBoZWlnaHQ6Jzc1JSdcbiAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICMnaXMzRCcgOiAndHJ1ZSdcbiAgICAgICAgICAgICAgaWYgZ3JhcGhcbiAgICAgICAgICAgICAgICBjaGFydCA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5QaWVDaGFydCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAndG90YWwtZXhwZW5kaXR1cmVzLXBpZSdcbiAgICAgICAgICAgICAgICBjaGFydC5kcmF3IHZpc19kYXRhLCBvcHRpb25zXG4gICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgKSwgMTAwMFxuICAgICAgICAgIGlmIGdyYXBoXG4gICAgICAgICAgICBnb29nbGUubG9hZCAndmlzdWFsaXphdGlvbicsICcxLjAnLFxuICAgICAgICAgICAgJ2NhbGxiYWNrJyA6IGRyYXdDaGFydCgpXG4gICAgICAgICAgICAncGFja2FnZXMnIDonY29yZWNoYXJ0J1xuICAgICAgICAgIHBsb3RfaGFuZGxlc1sndG90YWwtZXhwZW5kaXR1cmVzLXBpZSddID0ndG90YWwtZXhwZW5kaXR1cmVzLXBpZSdcbiAgICAgIGVsc2VcbiAgICAgICAgZGV0YWlsX2RhdGEudGFiY29udGVudCArPSByZW5kZXJfZmllbGRzIHRhYi5maWVsZHMsIGRhdGEsIHRlbXBsYXRlc1sndGFiZGV0YWlsLW5hbWV2YWx1ZS10ZW1wbGF0ZSddXG5cbiAgICBsYXlvdXRfZGF0YS50YWJjb250ZW50ICs9IHRlbXBsYXRlc1sndGFiZGV0YWlsLXRlbXBsYXRlJ10oZGV0YWlsX2RhdGEpXG4gIHJldHVybiB0ZW1wbGF0ZXNbJ3RhYnBhbmVsLXRlbXBsYXRlJ10obGF5b3V0X2RhdGEpXG5cblxuZ2V0X2xheW91dF9maWVsZHMgPSAobGEpIC0+XG4gIGYgPSB7fVxuICBmb3IgdCBpbiBsYVxuICAgIGZvciBmaWVsZCBpbiB0LmZpZWxkc1xuICAgICAgZltmaWVsZF0gPSAxXG4gIHJldHVybiBmXG5cbmdldF9yZWNvcmRfZmllbGRzID0gKHIpIC0+XG4gIGYgPSB7fVxuICBmb3IgZmllbGRfbmFtZSBvZiByXG4gICAgZltmaWVsZF9uYW1lXSA9IDFcbiAgcmV0dXJuIGZcblxuZ2V0X3VubWVudGlvbmVkX2ZpZWxkcyA9IChsYSwgcikgLT5cbiAgbGF5b3V0X2ZpZWxkcyA9IGdldF9sYXlvdXRfZmllbGRzIGxhXG4gIHJlY29yZF9maWVsZHMgPSBnZXRfcmVjb3JkX2ZpZWxkcyByXG4gIHVubWVudGlvbmVkX2ZpZWxkcyA9IFtdXG4gIHVubWVudGlvbmVkX2ZpZWxkcy5wdXNoKGYpIGZvciBmIG9mIHJlY29yZF9maWVsZHMgd2hlbiBub3QgbGF5b3V0X2ZpZWxkc1tmXVxuICByZXR1cm4gdW5tZW50aW9uZWRfZmllbGRzXG5cblxuYWRkX290aGVyX3RhYl90b19sYXlvdXQgPSAobGF5b3V0PVtdLCBkYXRhKSAtPlxuICAjY2xvbmUgdGhlIGxheW91dFxuICBsID0gJC5leHRlbmQgdHJ1ZSwgW10sIGxheW91dFxuICB0ID1cbiAgICBuYW1lOiBcIk90aGVyXCJcbiAgICBmaWVsZHM6IGdldF91bm1lbnRpb25lZF9maWVsZHMgbCwgZGF0YVxuXG4gIGwucHVzaCB0XG4gIHJldHVybiBsXG5cblxuIyBjb252ZXJ0cyB0YWIgdGVtcGxhdGUgZGVzY3JpYmVkIGluIGdvb2dsZSBmdXNpb24gdGFibGUgdG9cbiMgdGFiIHRlbXBsYXRlXG5jb252ZXJ0X2Z1c2lvbl90ZW1wbGF0ZT0odGVtcGwpIC0+XG4gIHRhYl9oYXNoPXt9XG4gIHRhYnM9W11cbiAgIyByZXR1cm5zIGhhc2ggb2YgZmllbGQgbmFtZXMgYW5kIHRoZWlyIHBvc2l0aW9ucyBpbiBhcnJheSBvZiBmaWVsZCBuYW1lc1xuICBnZXRfY29sX2hhc2ggPSAoY29sdW1ucykgLT5cbiAgICBjb2xfaGFzaCA9e31cbiAgICBjb2xfaGFzaFtjb2xfbmFtZV09aSBmb3IgY29sX25hbWUsaSBpbiB0ZW1wbC5jb2x1bW5zXG4gICAgcmV0dXJuIGNvbF9oYXNoXG5cbiAgIyByZXR1cm5zIGZpZWxkIHZhbHVlIGJ5IGl0cyBuYW1lLCBhcnJheSBvZiBmaWVsZHMsIGFuZCBoYXNoIG9mIGZpZWxkc1xuICB2YWwgPSAoZmllbGRfbmFtZSwgZmllbGRzLCBjb2xfaGFzaCkgLT5cbiAgICBmaWVsZHNbY29sX2hhc2hbZmllbGRfbmFtZV1dXG5cbiAgIyBjb252ZXJ0cyBoYXNoIHRvIGFuIGFycmF5IHRlbXBsYXRlXG4gIGhhc2hfdG9fYXJyYXkgPShoYXNoKSAtPlxuICAgIGEgPSBbXVxuICAgIGZvciBrIG9mIGhhc2hcbiAgICAgIHRhYiA9IHt9XG4gICAgICB0YWIubmFtZT1rXG4gICAgICB0YWIuZmllbGRzPWhhc2hba11cbiAgICAgIGEucHVzaCB0YWJcbiAgICByZXR1cm4gYVxuXG5cbiAgY29sX2hhc2ggPSBnZXRfY29sX2hhc2godGVtcGwuY29sX2hhc2gpXG4gIHBsYWNlaG9sZGVyX2NvdW50ID0gMFxuXG4gIGZvciByb3csaSBpbiB0ZW1wbC5yb3dzXG4gICAgY2F0ZWdvcnkgPSB2YWwgJ2dlbmVyYWxfY2F0ZWdvcnknLCByb3csIGNvbF9oYXNoXG4gICAgI3RhYl9oYXNoW2NhdGVnb3J5XT1bXSB1bmxlc3MgdGFiX2hhc2hbY2F0ZWdvcnldXG4gICAgZmllbGRuYW1lID0gdmFsICdmaWVsZF9uYW1lJywgcm93LCBjb2xfaGFzaFxuICAgIGlmIG5vdCBmaWVsZG5hbWUgdGhlbiBmaWVsZG5hbWUgPSBcIl9cIiArIFN0cmluZyArK3BsYWNlaG9sZGVyX2NvdW50XG4gICAgZmllbGROYW1lc1t2YWwgJ2ZpZWxkX25hbWUnLCByb3csIGNvbF9oYXNoXT12YWwgJ2Rlc2NyaXB0aW9uJywgcm93LCBjb2xfaGFzaFxuICAgIGZpZWxkTmFtZXNIZWxwW2ZpZWxkbmFtZV0gPSB2YWwgJ2hlbHBfdGV4dCcsIHJvdywgY29sX2hhc2hcbiAgICBpZiBjYXRlZ29yeVxuICAgICAgdGFiX2hhc2hbY2F0ZWdvcnldPz1bXVxuICAgICAgdGFiX2hhc2hbY2F0ZWdvcnldLnB1c2ggbjogdmFsKCduJywgcm93LCBjb2xfaGFzaCksIG5hbWU6IGZpZWxkbmFtZSwgbWFzazogdmFsKCdtYXNrJywgcm93LCBjb2xfaGFzaClcblxuICBjYXRlZ29yaWVzID0gT2JqZWN0LmtleXModGFiX2hhc2gpXG4gIGNhdGVnb3JpZXNfc29ydCA9IHt9XG4gIGZvciBjYXRlZ29yeSBpbiBjYXRlZ29yaWVzXG4gICAgaWYgbm90IGNhdGVnb3JpZXNfc29ydFtjYXRlZ29yeV1cbiAgICAgIGNhdGVnb3JpZXNfc29ydFtjYXRlZ29yeV0gPSB0YWJfaGFzaFtjYXRlZ29yeV1bMF0ublxuICAgIGZpZWxkcyA9IFtdXG4gICAgZm9yIG9iaiBpbiB0YWJfaGFzaFtjYXRlZ29yeV1cbiAgICAgIGZpZWxkcy5wdXNoIG9ialxuICAgIGZpZWxkcy5zb3J0IChhLGIpIC0+XG4gICAgICByZXR1cm4gYS5uIC0gYi5uXG4gICAgdGFiX2hhc2hbY2F0ZWdvcnldID0gZmllbGRzXG5cbiAgY2F0ZWdvcmllc19hcnJheSA9IFtdXG4gIGZvciBjYXRlZ29yeSwgbiBvZiBjYXRlZ29yaWVzX3NvcnRcbiAgICBjYXRlZ29yaWVzX2FycmF5LnB1c2ggY2F0ZWdvcnk6IGNhdGVnb3J5LCBuOiBuXG4gIGNhdGVnb3JpZXNfYXJyYXkuc29ydCAoYSxiKSAtPlxuICAgIHJldHVybiBhLm4gLSBiLm5cblxuICB0YWJfbmV3aGFzaCA9IHt9XG4gIGZvciBjYXRlZ29yeSBpbiBjYXRlZ29yaWVzX2FycmF5XG4gICAgdGFiX25ld2hhc2hbY2F0ZWdvcnkuY2F0ZWdvcnldID0gdGFiX2hhc2hbY2F0ZWdvcnkuY2F0ZWdvcnldXG5cbiAgdGFicyA9IGhhc2hfdG9fYXJyYXkodGFiX25ld2hhc2gpXG4gIHJldHVybiB0YWJzXG5cblxuY2xhc3MgVGVtcGxhdGVzMlxuXG4gIEBsaXN0ID0gdW5kZWZpbmVkXG4gIEB0ZW1wbGF0ZXMgPSB1bmRlZmluZWRcbiAgQGRhdGEgPSB1bmRlZmluZWRcbiAgQGV2ZW50cyA9IHVuZGVmaW5lZFxuXG4gIGNvbnN0cnVjdG9yOigpIC0+XG4gICAgQGxpc3QgPSBbXVxuICAgIEBldmVudHMgPSB7fVxuICAgIHRlbXBsYXRlTGlzdCA9IFsndGFicGFuZWwtdGVtcGxhdGUnLCAndGFiZGV0YWlsLXRlbXBsYXRlJywgJ3RhYmRldGFpbC1uYW1ldmFsdWUtdGVtcGxhdGUnLCAndGFiZGV0YWlsLWZpbnN0YXRlbWVudC10ZW1wbGF0ZScsICd0YWJkZXRhaWwtb2ZmaWNpYWwtdGVtcGxhdGUnLCAndGFiZGV0YWlsLWVtcGxveWVlLWNvbXAtdGVtcGxhdGUnLCAndGFiZGV0YWlsLWZpbmFuY2lhbC1oZWFsdGgtdGVtcGxhdGUnLCAndGFiZGV0YWlsLWZpbmFuY2lhbC1zdGF0ZW1lbnRzLXRlbXBsYXRlJ11cbiAgICB0ZW1wbGF0ZVBhcnRpYWxzID0gWyd0YWItdGVtcGxhdGUnXVxuICAgIEB0ZW1wbGF0ZXMgPSB7fVxuICAgIGZvciB0ZW1wbGF0ZSxpIGluIHRlbXBsYXRlTGlzdFxuICAgICAgQHRlbXBsYXRlc1t0ZW1wbGF0ZV0gPSBIYW5kbGViYXJzLmNvbXBpbGUoJCgnIycgKyB0ZW1wbGF0ZSkuaHRtbCgpKVxuICAgIGZvciB0ZW1wbGF0ZSxpIGluIHRlbXBsYXRlUGFydGlhbHNcbiAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJQYXJ0aWFsKHRlbXBsYXRlLCAkKCcjJyArIHRlbXBsYXRlKS5odG1sKCkpXG5cbiAgYWRkX3RlbXBsYXRlOiAobGF5b3V0X25hbWUsIGxheW91dF9qc29uKSAtPlxuICAgIEBsaXN0LnB1c2hcbiAgICAgIHBhcmVudDp0aGlzXG4gICAgICBuYW1lOmxheW91dF9uYW1lXG4gICAgICByZW5kZXI6KGRhdCkgLT5cbiAgICAgICAgQHBhcmVudC5kYXRhID0gZGF0XG4gICAgICAgIHJlbmRlcl90YWJzKGxheW91dF9qc29uLCBkYXQsIHRoaXMsIEBwYXJlbnQpXG4gICAgICBiaW5kOiAodHBsX25hbWUsIGNhbGxiYWNrKSAtPlxuICAgICAgICBpZiBub3QgQHBhcmVudC5ldmVudHNbdHBsX25hbWVdXG4gICAgICAgICAgQHBhcmVudC5ldmVudHNbdHBsX25hbWVdID0gW2NhbGxiYWNrXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQHBhcmVudC5ldmVudHNbdHBsX25hbWVdLnB1c2ggY2FsbGJhY2tcbiAgICAgIGFjdGl2YXRlOiAodHBsX25hbWUpIC0+XG4gICAgICAgIGlmIEBwYXJlbnQuZXZlbnRzW3RwbF9uYW1lXVxuICAgICAgICAgIGZvciBlLGkgaW4gQHBhcmVudC5ldmVudHNbdHBsX25hbWVdXG4gICAgICAgICAgICBlIHRwbF9uYW1lLCBAcGFyZW50LmRhdGFcblxuICBsb2FkX3RlbXBsYXRlOih0ZW1wbGF0ZV9uYW1lLCB1cmwpIC0+XG4gICAgJC5hamF4XG4gICAgICB1cmw6IHVybFxuICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgY2FjaGU6IHRydWVcbiAgICAgIHN1Y2Nlc3M6ICh0ZW1wbGF0ZV9qc29uKSA9PlxuICAgICAgICBAYWRkX3RlbXBsYXRlKHRlbXBsYXRlX25hbWUsIHRlbXBsYXRlX2pzb24pXG4gICAgICAgIHJldHVyblxuXG4gIGxvYWRfZnVzaW9uX3RlbXBsYXRlOih0ZW1wbGF0ZV9uYW1lLCB1cmwpIC0+XG4gICAgJC5hamF4XG4gICAgICB1cmw6IHVybFxuICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgY2FjaGU6IHRydWVcbiAgICAgIHN1Y2Nlc3M6ICh0ZW1wbGF0ZV9qc29uKSA9PlxuICAgICAgICB0ID0gY29udmVydF9mdXNpb25fdGVtcGxhdGUgdGVtcGxhdGVfanNvblxuICAgICAgICBAYWRkX3RlbXBsYXRlKHRlbXBsYXRlX25hbWUsIHQpXG4gICAgICAgIHJldHVyblxuXG5cbiAgZ2V0X25hbWVzOiAtPlxuICAgICh0Lm5hbWUgZm9yIHQgaW4gQGxpc3QpXG5cbiAgZ2V0X2luZGV4X2J5X25hbWU6IChuYW1lKSAtPlxuICAgIGZvciB0LGkgaW4gQGxpc3RcbiAgICAgIGlmIHQubmFtZSBpcyBuYW1lXG4gICAgICAgIHJldHVybiBpXG4gICAgIHJldHVybiAtMVxuXG4gIGdldF9odG1sOiAoaW5kLCBkYXRhKSAtPlxuICAgIGlmIChpbmQgaXMgLTEpIHRoZW4gcmV0dXJuICBcIlwiXG5cbiAgICBpZiBAbGlzdFtpbmRdXG4gICAgICByZXR1cm4gQGxpc3RbaW5kXS5yZW5kZXIoZGF0YSlcbiAgICBlbHNlXG4gICAgICByZXR1cm4gXCJcIlxuXG4gIGFjdGl2YXRlOiAoaW5kLCB0cGxfbmFtZSkgLT5cbiAgICBpZiBAbGlzdFtpbmRdXG4gICAgICBAbGlzdFtpbmRdLmFjdGl2YXRlIHRwbF9uYW1lXG5cbm1vZHVsZS5leHBvcnRzID0gVGVtcGxhdGVzMlxuIl19
