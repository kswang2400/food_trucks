FoodTrucks.Views.Index = Backbone.CompositeView.extend({
  template: JST["index"],
  className: "index col-md-6 col-md-offset-4",

  events: {
    "click #search-current": "searchByCurrentLocation"
  },

  initialize: function (options) {
    this.collection = options.trucks;

    this.listenTo(this.collection, "sync", this.render);
    this.listenTo(this.collection, "add", this.addTruckListItemSubview);

    var map;

    google.maps.event.addDomListener(window, 'load', function () {
      map = new google.maps.Map(document.getElementById('map-canvas'), {
        zoom: 14,
        center: {lat: 37.78, lng: -122.41}
      }); 
    });
  },

  addTruckListItemSubview: function (truck) {
    var subview = new FoodTrucks.Views.TruckListItem({ model: truck });
    this.addSubview("#trucks-list", subview);
  },

  searchByCurrentLocation: function () {
    $("#spinner").show();
    navigator.geolocation.getCurrentPosition(function (pos) { 
      var latitude = pos.coords.latitude
      var longitude = pos.coords.longitude
      var query = { location: {
        latitude: latitude,
        longitude: longitude
      }}

      this.collection.fetch({ 
        data: query, 
        error: function (col, err) {
          console.log(err.responseText);
          $("#error-message").show();
          $("#spinner").hide();
        }
      });     
    }.bind(this));
  },

  render: function () {
    var content = this.template({ trucks: this.collection });
    this.$el.html(content);
    this.attachSubviews();
    return this;  
  }
});