var mongoose = require('mongoose');
var Venue = mongoose.model("venue");

const createResponse = function (res, status, content) {
    res.status(status).json(content);
}

var converter = (function () {
    var earthRadius = 6371; // km
    var radian2Kilometer = function (radian) {
        return parseFloat(radian * earthRadius);
    };
    var kilometer2Radian = function (distance) {
        return parseFloat(distance / earthRadius);
    };
    return {
        radian2Kilometer, kilometer2Radian,
    }
})();

const listVenues = function (req, res) {
    var lat = parseFloat(req.query.lat) || 0;
    var long = parseFloat(req.query.long) || 0;
    var point = { type: "Point", coordinates: [lat, long] };
    var geoOptions = {
        distanceField: "distance", spherical: true,
        maxDistance: converter.radian2Kilometer(100)
    };
    try {
        Venue.aggregate([
            {
                $geoNear: {
                    near: point, ...geoOptions,
                }
            }]).then((result) => {
                const venues = result.map(function (venue) {
                    return {
                        distance: converter.kilometer2Radian(venue.distance),
                        name: venue.name,
                        address: venue.address,
                        rating: venue.rating,
                        foodanddrink: venue.foodanddrink,
                        id: venue._id,
                    };
                });
                if (venues.length > 0)
                    createResponse(res, "200", venues);
                else
                    createResponse(res, "200", { "status": "Civarda mekan yok" });
            })
    } catch (error) {
        createResponse(res, "404", error);
    }
};

const addVenue = function (req, res) {
    createResponse(res, 200, { status: "başarılı" });
}

const getVenue = async function (req, res) {
    try {
        await Venue.findById(req.params.venueid).exec().then(function (venue) {
            createResponse(res, 200, venue);
        });

    }
    catch (err) {
        createResponse(res, 404, { status: "böyle bir mekan yok" });
    }
    //createResponse(res,200,{status:"getvenue başarılı"});
}

const updateVenue = function (req, res) {
    createResponse(res, 200, { status: "update başarılı" });
}

const deleteVenue = function (req, res) {
    createResponse(res, 200, { status: "başarılı" });
}

module.exports = {
    listVenues,
    addVenue,
    getVenue,
    updateVenue,
    deleteVenue
}