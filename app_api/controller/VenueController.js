var mongoose = require("mongoose");
var Venue = mongoose.model("venue");

const createResponse = function (res, status, content) {
  res.status(status).json(content);
};

var converter = (function () {
  var earthRadius = 6371; // km
  var radian2Kilometer = function (radian) {
    return parseFloat(radian * earthRadius);
  };
  var kilometer2Radian = function (distance) {
    return parseFloat(distance / earthRadius);
  };
  return {
    radian2Kilometer,
    kilometer2Radian,
  };
})();

// MEKANLARI LİSTELE
const listVenues = async function (req, res) {
  var lat = parseFloat(req.query.lat) || 0;
  var long = parseFloat(req.query.long) || 0;
  var point = { type: "Point", coordinates: [lat, long] };
  var geoOptions = {
    distanceField: "dis",
    spherical: true,
    maxDistance: converter.radian2Kilometer(100),
  };
  try {
    const result = await Venue.aggregate([
      {
        $geoNear: {
          near: point,
          ...geoOptions,
        },
      },
    ]);
    const venues = result.map((venue) => {
      return {
        distance: converter.kilometer2Radian(venue.dis),
        name: venue.name,
        address: venue.address,
        rating: venue.rating,
        foodanddrink: venue.foodanddrink,
        id: venue._id,
      };
    });
    if (venues.length > 0) {
      createResponse(res, 200, venues);
    } else {
      createResponse(res, 200, { status: "Civarda mekan yok" });
    }
  } catch (error) {
    createResponse(res, 404, error);
  }
};

// YENİ MEKAN EKLE (DÜZELTİLDİ: days -> day)
const addVenue = async function (req, res) {
  try {
    await Venue.create({
      ...req.body,
      coordinates: [parseFloat(req.body.lat), parseFloat(req.body.long)],
      hours: [
        {
          day: req.body.days1, // Burası 'days' idi, 'day' yapıldı
          open: req.body.open1,
          close: req.body.close1,
          isClosed: req.body.isClosed1,
        },
        {
          day: req.body.days2, // Burası 'days' idi, 'day' yapıldı
          open: req.body.open2,
          close: req.body.close2,
          isClosed: req.body.isClosed2,
        },
      ],
    }).then(function (response) {
      createResponse(res, 201, response);
    });
  } catch (error) {
    createResponse(res, 400, { status: "Ekleme başarısız", error: error });
  }
};

const getVenue = async function (req, res) {
  try {
    await Venue.findById(req.params.venueid)
      .exec()
      .then(function (venue) {
        if (!venue) {
          createResponse(res, 404, { status: "Böyle bir mekan yok" });
          return;
        }
        createResponse(res, 200, venue);
      });
  } catch (error) {
    createResponse(res, 404, { status: "Böyle bir mekan yok" });
  }
};

// MEKAN GÜNCELLE (DÜZELTİLDİ: days -> day)
const updateVenue = async function (req, res) {
  try {
    const updatedVenue = await Venue.findByIdAndUpdate(
      req.params.venueid,
      {
        ...req.body,
        coordinates: [parseFloat(req.body.lat), parseFloat(req.body.long)],
        hours: [
          {
            day: req.body.days1, // Burası 'days' idi, 'day' yapıldı
            open: req.body.open1,
            close: req.body.close1,
            isClosed: req.body.isClosed1,
          },
          {
            day: req.body.days2, // Burası 'days' idi, 'day' yapıldı
            open: req.body.open2,
            close: req.body.close2,
            isClosed: req.body.isClosed2,
          },
        ],
      },
      { new: true }
    );
    createResponse(res, 201, updatedVenue);
  } catch (error) {
    createResponse(res, 400, { status: "Güncelleme başarısız", error: error });
  }
};

const deleteVenue = async function (req, res) {
  try {
    await Venue.findByIdAndDelete(req.params.venueid).then(function (venue) {
      if (venue) {
        createResponse(res, 200, { status: venue.name + " isimli mekan silindi" });
      } else {
        createResponse(res, 404, { status: "Böyle bir mekan yok!" });
      }
    });
  } catch (error) {
    createResponse(res, 404, { status: "Böyle bir mekan yok!" });
  }
};

module.exports = {
  listVenues,
  addVenue,
  getVenue,
  updateVenue,
  deleteVenue,
};