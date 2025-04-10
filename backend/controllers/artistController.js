import Artist from "../models/artistModel.js";
import { getConcertFromAPI } from "../services/concertService.js";

export const getConcert = async (req, res) => {
  try {
    const { artistName, date } = req.params;
    const concertData = await getConcertFromAPI(artistName, date);

    if (!concertData) {
      return res.status(404).json({ error: "Concert not found from API" });
    }

    res.json(concertData);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const saveConcert = async (req, res) => {
  try {
    const { id: concertId, eventDate, artist, venue, sets: {set: sets}, url } =
      req.body;

    let artistDoc = await Artist.findOne({ artistName: artist.name });

    // If the artist does not exist, create a new artist entry
    if (!artistDoc) {
      artistDoc = new Artist({
        artistName: artist.name,
        artistId : artist.mbid, // figure out
        concerts: [],
      });
    }
          
    const existingConcert = artistDoc.concerts.find(c => c.concertId === concertId);
    if (existingConcert) {
      return res.status(409).json({ error: "Concert already saved" });
    }

    artistDoc.concerts.push({
      concertId,
      eventDate,
      venue,
      sets,
      url
    });
    
    await artistDoc.save();
    res.status(201).json(artistDoc);
  } catch (error) {
    console.error("error: ", error);
    res.status(500).json({ error: "Could not save concert" });
  }
};

export const getSavedConcert = async (req, res) => {
  try {
    const { concertId } = req.params;

    if (!concertId) {
      return res.status(400).json({ error: "concertId is required" });
    }

    const concerts = await Concert.findOne({concertId});
    if (!concert) {
      return res.status(404).json({ error: "Concert not found"});
    }

    res.json(concerts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not fetch concert" });
  }
};

export const getSavedConcerts = async (req, res) => {
  try {
    //  const { showId } = req.params;

    const concerts = await Artist.find();
    
    res.json(concerts);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch concerts" });
  }
};

export const deleteConcert = async (req, res) => {
  const {artistId, concertId} = req.params;

  if (!mongoose.Types.ObjectId.isValid(artistId) || !mongoose.Types.ObjectId.isValid(concertId)) {
    return res.status(400).json({ error: "Invalid artist or concert ID" });
  }

  const artist = await Artist.findOneAndUpdate(
    { _id: artistId },
    { $pull: { concerts: { concertId } } },
    { new: true }
  );

  if (!artist) {
    return res.status(404).json({ error: "Artist not found"})
  }

  if (artist.concerts.length === 0) {
    await Artist.findByIdAndDelete(artistId);
    return res.status(200).json({ message: "Artist deleted as there were no more concerts" });
  }

  res.status(200).json(concerts)
  // res.status(200).json({ message: "Concert removed successfully", artist });
};