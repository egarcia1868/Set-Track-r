import Concert from "../models/concertModel.js";
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
    const { id: concertId, eventDate, artist, venue, sets, url } =
      req.body;
    const existingConcert = await Concert.findOne({ concertId });

    if (existingConcert) {
      return res.status(409).json({ error: "Concert already saved" });
    }

    const formattedArtist = {
      artistId: artist.mbid,
      name: artist.name,
      sortName: artist.sortName,
      disambiguation: artist.disambiguation,
      url: artist.url
    };

    const newConcert = new Concert({
      concertId,
      eventDate,
      artist: formattedArtist,
      venue,
      sets,
      url
    });
    
    await newConcert.save();
    res.status(201).json(newConcert);
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
    const concerts = await Concert.find();
    res.json(concerts);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch concerts" });
  }
};
