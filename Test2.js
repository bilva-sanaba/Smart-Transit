   
  function initMap() {
        var origin1 = "Durham, NC";
        var destinationB = "Chapel Hill";
        var geocoder = new google.maps.Geocoder;
        var service = new google.maps.DistanceMatrixService;
        service.getDistanceMatrix({
          origins: [origin1],
          destinations: [destinationB],
          travelMode: 'DRIVING',
          unitSystem: google.maps.UnitSystem.IMPERIAL,
          avoidHighways: false,
          avoidTolls: false
        }, function(response, status) {
          if (status !== 'OK') {
            alert('Error was: ' + status);
          } else {
            var originList = response.originAddresses;
            var destinationList = response.destinationAddresses;
              var results = response.rows[0].elements;
                console.log(results[0].distance.text);
                console.log(results[0].duration.text);
              }
            
          });
        
      }
