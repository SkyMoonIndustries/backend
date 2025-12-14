var mongoose = require("mongoose");
var Venue = mongoose.model("venue");

const createResponse = function (res, status, content) {
  res.status(status).json(content);
};

// Puan Hesaplama Yardımcı Metodu (Web-10 Slide 7)
var calculateLastRating = function (incomingVenue, isDeleted) {
  var i,
    numComments,
    avgRating,
    sumRating = 0;
  
  if (incomingVenue.comments) {
    numComments = incomingVenue.comments.length;
    if (incomingVenue.comments.length == 0 && isDeleted) {
      avgRating = 0;
    } else {
      for (i = 0; i < numComments; i++) {
        sumRating = sumRating + incomingVenue.comments[i].rating;
      }
      avgRating = Math.ceil(sumRating / numComments);
    }
    incomingVenue.rating = avgRating;
    incomingVenue.save();
  }
};

// Ortalama Puanı Güncelleme (Web-10 Slide 8)
var updateRating = function (venueid, isDeleted) {
  Venue.findById(venueid)
    .select("rating comments")
    .exec()
    .then(function (venue) {
      calculateLastRating(venue, isDeleted);
    });
};

// Yorum Oluşturma Yardımcı Metodu (Web-10 Slide 9)
var createComment = function (req, res, incomingVenue) {
  try {
    incomingVenue.comments.push(req.body);
    incomingVenue.save().then(function (venue) {
      var comments = venue.comments;
      var comment = comments[comments.length - 1];
      updateRating(venue._id, false);
      createResponse(res, 201, comment);
    });
  } catch (error) {
    createResponse(res, 400, error);
  }
};

// YORUM EKLE (POST) - (Web-10 Slide 10)
const addComment = async function (req, res) {
  try {
    await Venue.findById(req.params.venueid)
      .select("comments")
      .exec()
      .then((incomingVenue) => {
        if (!incomingVenue) {
            createResponse(res, 404, { status: "Mekan bulunamadı" });
        } else {
            createComment(req, res, incomingVenue);
        }
      });
  } catch (error) {
    createResponse(res, 400, { status: "Yorum ekleme başarısız" });
  }
};

// TEK YORUM GETİR (GET)
const getComment = async function (req, res) {
  try {
    await Venue.findById(req.params.venueid)
      .select("name comments")
      .exec()
      .then(function (venue) {
        var response, comment;
        if (!venue) {
          createResponse(res, 404, { status: "Mekan bulunamadı" });
          return;
        }
        if (venue.comments && venue.comments.id(req.params.commentid)) {
          comment = venue.comments.id(req.params.commentid);
          response = {
            venue: {
              name: venue.name,
              id: req.params.venueid,
            },
            comment: comment,
          };
          createResponse(res, 200, response);
        } else {
          createResponse(res, 404, { status: "Yorum bulunamadı" });
        }
      });
  } catch (error) {
    createResponse(res, 404, { status: "Mekan bulunamadı" });
  }
};

// YORUM GÜNCELLE (PUT) - (Web-10 Slide 16)
const updateComment = async function (req, res) {
  try {
    await Venue.findById(req.params.venueid)
      .select("comments")
      .exec()
      .then(function (venue) {
        try {
          let comment = venue.comments.id(req.params.commentid);
          comment.set(req.body);
          venue.save().then(function () {
            updateRating(venue._id, false);
            createResponse(res, 200, comment);
          });
        } catch (error) {
          createResponse(res, 400, error);
        }
      });
  } catch (error) {
    createResponse(res, 400, error);
  }
};

// YORUM SİL (DELETE) - (Web-10 Slide 22)
const deleteComment = async function (req, res) {
  try {
    await Venue.findById(req.params.venueid)
      .select("comments")
      .exec()
      .then(function (venue) {
        try {
          let comment = venue.comments.id(req.params.commentid);
          comment.deleteOne();
          venue.save().then(function () {
            updateRating(venue._id, true);
            createResponse(res, 200, {
              status: comment.author + " isimli kişinin yorumu silindi",
            });
          });
        } catch (error) {
          createResponse(res, 400, error);
        }
      });
  } catch (error) {
    createResponse(res, 400, error);
  }
};

module.exports = {
  getComment,
  addComment,
  updateComment,
  deleteComment,
};