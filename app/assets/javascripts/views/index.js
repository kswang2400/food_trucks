FoodTrucks.Views.Index = Backbone.CompositeView.extend({
  template: JST["index"],
  infoWindowTemplate: JST["marker_overlay"],
  className: "index",

  events: {
    "click #search-current": "searchByCurrentLocation",
    "click #refresh": "refreshPage",
    "click #search-input": "searchInput"
  },

  initialize: function () {
    this.listenTo(this.collection, "add", this.addTruckListItem);
  },

  addTruckListItem: function (truck) {
    console.log(truck);
    var subview = new FoodTrucks.Views.TruckListItem({ model: truck });

    this.addSubview("#truck-list", subview);
  },

  addTruckMarker: function (trucks) {
    var that = this;

    trucks.each(function (truck) {
      var location = truck.get("location")
      var longitude = location["coordinates"][0]
      var latitude = location["coordinates"][1]
      var name = truck.get("applicant")
      // console.log(name, longitude, latitude, truck.get("status"));

      // Available Data
      // address: "865 MARKET ST"
      // applicant: "Kettle Corn Star"
      // approved: "2015-04-23T13:59:20.000"
      // block: "3705"
      // blocklot: "3705 042"
      // cnn: "8747103"
      // expirationdate: "2016-03-15T00:00:00.000"
      // facilitytype: "Push Cart"
      // fooditems: "Kettle Corn: Funnel Cakes: Waffles: Lemonade"
      // latitude: "37.7839469079742"
      // location: Object
      // locationdescription: "MARKET ST: POWELL ST to 05TH ST \ CYRIL MAGNIN ST (865 - 899) -- SOUTH --"
      // longitude: "-122.407158344984"
      // lot: "042"
      // objectid: "648393"
      // permit: "15MFF-0123"
      // priorpermit: "0"
      // received: "Apr 23 2015 1:46PM"
      // schedule: "http://bsm.sfdpw.org/PermitsTracker/reports/report.aspx?title=schedule&report=rptSchedule&params=permit=15MFF-0123&ExportPDF=1&Filename=15MFF-0123_schedule.pdf"
      // status: "APPROVED"
      // x: "6010561.591"
      // y: "2113530.347"

      var contentString = that.infoWindowTemplate({ truck: truck });

      var infowindow = new google.maps.InfoWindow({
        content: contentString
      });

      var myLatlng = new google.maps.LatLng(latitude, longitude);
      var marker = new google.maps.Marker({
        position: myLatlng,
        map: that.map,
        title: name
      });

      marker.addListener('click', function() {
        infowindow.open(that.map, marker);
      });
    });

    $("#spinner").hide();
  },

  handleError: function () {
    $("#error-message").show();
    $("#spinner").hide();
  },

  initializeMap: function () {
    var that = this;
    this.map = new google.maps.Map(document.getElementById('map-canvas'), {
      zoom: 14,
      center: {lat: this.latitude, lng: this.longitude}
    });

    var input = $("#search-location")[0];
    var searchBox = new google.maps.places.SearchBox(input);
    this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    
    this.map.addListener('bounds_changed', function() {
      searchBox.setBounds(this.map.getBounds());
    }.bind(this));

    var markers = [];

    searchBox.addListener('places_changed', function() {
      var places = searchBox.getPlaces();

      if (places.length == 0) {
        return;
      }

      // Clear out the old markers.
      markers.forEach(function(marker) {
        marker.setMap(null);
      });
      markers = [];

      // For each place, get the icon, name and location.
      var bounds = new google.maps.LatLngBounds();
      places.forEach(function(place) {
        // Create a marker for each place.
        markers.push(new google.maps.Marker({
          map: that.map,
          title: place.name,
          position: place.geometry.location
        }));

        if (place.geometry.viewport) {
          // Only geocodes have viewport.
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }
      });

      that.map.fitBounds(bounds);

      that.searchLat = places[0].geometry.location.G
      that.searchLng = places[0].geometry.location.K

      that.map.setZoom(15);
    });

    var myLatlng = new google.maps.LatLng(this.latitude , this.longitude);
    var marker = new google.maps.Marker({
      position: myLatlng,
      map: this.map,
      title: "You are here!"
    });

    $("#map-spinner").hide();
  },

  searchByCurrentLocation: function (event) {
    event.preventDefault();
    var that = this;

    $("#error-message").hide();
    $("#spinner").show();

    navigator.geolocation.getCurrentPosition(function (pos) { 
      var latitude = pos.coords.latitude
      var longitude = pos.coords.longitude
      var query = { location: {
        latitude: latitude,
        longitude: longitude
      }}

      that.collection.fetch({ 
        data: query,
        success: that.addTruckMarker.bind(that), 
        error: that.handleError.bind(that)
      });     
    });
  },

  searchInput: function (event) {
    event.preventDefault();
    var that = this;

    $("#error-message").hide();
    $("#spinner").show();

    query = { "location": {
      latitude: this.searchLat,
      longitude: this.searchLng
    }}

    this.collection.fetch({
      data: query,
      success: that.addTruckMarker.bind(that), 
      error: that.handleError.bind(that)
    });
  },

  refreshPage: function () {
    window.location.reload()
  },

  render: function () {
    var content = this.template();
    this.$el.html(content);

    navigator.geolocation.getCurrentPosition(function (pos) {
      this.latitude = pos.coords.latitude;
      this.longitude = pos.coords.longitude;

      this.initializeMap();
    }.bind(this), function (err) {
      // need to write error handling when user denies permission to use location
      console.log(err);
    });

    setTimeout(function () {
      $("#map-not-load").show();
    }, 2500);

    return this;  
  }
});