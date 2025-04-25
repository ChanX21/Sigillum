import {QdrantClient} from '@qdrant/js-client-rest';

const qdrantClient = new QdrantClient({url: process.env.QDRANT_ENDPOINT, apiKey: process.env.QDRANT_KEY});

export default qdrantClient;
