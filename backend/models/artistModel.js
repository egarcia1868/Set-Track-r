import mongoose from "mongoose";

const { Schema, model } = mongoose;

const artistSchema = new Schema(
  {
    artistName: { type: String },
    artistId: { type: String },
    concerts: {
      type: [],
      // type: [
      //   {
      //     concertId: { type: String, unique: true, required: true },
      //     eventDate: { type: String, required: true },
      //     artist: {
      //       type: {
      //         mbid: { type: String, required: true },
      //         name: { type: String, required: true },
      //         sortName: { type: String },
      //         disambiguation: { type: String },
      //         url: { type: String },
      //       },
      //       required: true,
      //     },
      //     venue: {
      //       type: {
      //         name: { type: String },
      //         city: {
      //           type: {
      //             name: { type: String, required: true },
      //             state: { type: String, required: true },
      //             stateCode: { type: String, required: true },
      //             coords: {
      //               type: {
      //                 lat: { type: Number },
      //                 long: { type: Number },
      //               },
      //             },
      //             country: {
      //               type: { code: String, name: String },
      //               required: true,
      //             },
      //           },
      //         },
      //         url: { type: String },
      //       },
      //       required: true,
      //     },
      //     sets: {
      //       type: [
      //         {
      //           name: { type: String },
      //           encore: { type: String },
      //           song: {
      //             type: [
      //               {
      //                 name: { type: String, required: true },
      //                 info: { type: String },
      //                 cover: {
      //                   type: {
      //                     mbid: { type: String },
      //                     name: { type: String },
      //                     sortName: { type: String },
      //                     disambiguation: { type: String },
      //                     url: { type: String },
      //                   },
      //                 },
      //               },
      //             ],
      //           },
      //         },
      //       ],
      //     },
      //     url: { type: String },
      //   },
      // ],
      required: true,
    },
  },
  { timestamps: true }
);

export default model("Artist", artistSchema);
