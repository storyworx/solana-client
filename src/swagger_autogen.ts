const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "My API",
    description: "Description",
  },
  host: "api.storyworx.co/solana-client/api/v1/",
  schemes: ["https"],
};

const outputFile = "./swagger_output.json";
const endpointsFiles = ["./index.ts"];

swaggerAutogen(outputFile, endpointsFiles, doc);
