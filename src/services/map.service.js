const axios = require('axios');
const NodeGeocoder = require('node-geocoder');
const config = require("../config/config");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");
const { Client } = require('@googlemaps/google-maps-services-js');

const googleKey = config.google_map.key;
googleMapsClient = new Client({
  apiKey: googleKey
});

const calcDistance = async (routeDetails, stops, optimize) => {

  try {
    if (stops == "" || stops == []) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Stops should not be empty')
    }
    if (routeDetails.start_latitude == "" || routeDetails.start_longitude == "") {
      const latlong = await getLatLong(routeDetails.start_address)
      routeDetails.start_latitude = latlong[0].latitude
      routeDetails.start_longitude = latlong[0].longitude
    }   
    if (routeDetails.end_latitude == ""&&routeDetails.end_address!="" || routeDetails.end_longitude == ""&&routeDetails.end_address!="") {
      const latlong = await getLatLong(routeDetails.end_address)
      routeDetails.end_latitude = latlong[0].latitude
      routeDetails.end_longitude = latlong[0].longitude
    }
    var origins = routeDetails.start_latitude + ',' + routeDetails.start_longitude;
    
    var waypoints = [];
    let actualStops = [];
   
    for (const item of stops) {
      let location = {}
      if (item.latitude == "" || item.longitude == "") {
        if (!item.address && item.address == "") {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Address should not be empty')
        }

        const latlong = await getLatLong(item.address)
        if (latlong === null || !latlong || latlong == [] || latlong == "") {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid Address')
        }
        if (latlong && latlong !== undefined) {
          location.latitude = (latlong.length > 0 && latlong[0].latitude) ? latlong[0].latitude : '';
          location.longitude = (latlong.length > 0 && latlong[0].longitude) ? latlong[0].longitude : '';
          item.latitude = location.latitude;
          item.longitude = location.longitude;
          location = location.latitude + ',' + location.longitude;
        } else {
          throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid Address')
        }
      } else {
        location = item.latitude + ',' + item.longitude;
      }
      actualStops.push(item);
      waypoints.push(location);
    };
    let maxDistance = 0;
let longestStop = null;

for (let i = 0; i < actualStops.length; i++) {
  const stop1 = actualStops[i];

  const distance = haversineDistance(stop1.latitude, stop1.longitude, routeDetails.start_latitude, routeDetails.start_latitude);

  if (distance > maxDistance) {
    maxDistance = distance;
    longestStop = stop1;
  }
}
    let endLatvar=routeDetails.end_latitude?routeDetails.end_latitude:longestStop.latitude
    let endLongvar=routeDetails.end_longitude?routeDetails.end_longitude:longestStop.longitude
    var destinations = endLatvar + ',' + endLongvar;
   let optimizedRoute = {};
    optimizedRoute = await optimizeRoute(origins, destinations, waypoints, optimize);
    if (optimize) {
      actualStops = optimizedRoute.waypoint_order.map(i => actualStops[i]);
    }
    if (optimizedRoute === undefined) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Please enter proper lat and long')
    }
    const legs = optimizedRoute.legs;
    let dist = 0;
    legs.forEach(async (item) => {

      dist = dist + item.distance.value;
    });
    dist = dist / 1000;
    dist = (dist * 0.621371).toFixed(2);
    return { stops: actualStops, distance: dist };
  }
  catch (e) {
    console.log(e);
    if (e instanceof ApiError) {
      throw new ApiError(httpStatus.BAD_REQUEST, e);
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, e);
  }
}


const getLatLong = async (address) => {
  try {
    const location = await NodeGeocoder({
      provider: 'google',
      apiKey: googleKey
    }).geocode(address)
    return location;
  }
  catch (e) {
    return e
  }

};

async function optimizeRoute(origins, destinations, waypoints, optimize) {
  return new Promise((resolve, reject) => {
    googleMapsClient.directions({
      params: {
        origin: origins,
        destination: destinations,
        waypoints: waypoints,
        optimize,
        key: googleKey
      },
      timeout: 5000 // milliseconds
    })
      .then((response) => {
        resolve(response.data.routes[0]);
      }).catch((error) => {
        console.log(error);
      })
    // },(err, result) => {
    //   if (err) {
    //     reject(err);
    //   } else {
    //     resolve(result.json.routes[0]);
    //   }
    // });
  })
    .catch((error) => {
      console.log(error.response.data.error_message);
    });
}


// New function to get place ID
const getPlaceId = async (address) => {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: googleKey
      }
    });
    const results = response.data.results;
    if (results.length > 0) {
      return results[0].place_id;
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid Address');
    }
  } catch (e) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid Address');
  }
};

const getPlaceIdFromLatLong = async (latitude, longitude) => {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        latlng: `${latitude},${longitude}`,
        key: googleKey
      }
    });

    const results = response.data.results;
    if (results.length > 0) {
      // The first result is typically the most accurate
      return results[0].place_id;
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid Latitude and Longitude');
    }
  } catch (e) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid Latitude and Longitude');
  }
};

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  // Haversine formula to calculate distance between two points
  const R = 6371; // Earth radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
};


module.exports = {
  calcDistance,
  getLatLong,
  optimizeRoute,
  getPlaceId,
  getPlaceIdFromLatLong
}