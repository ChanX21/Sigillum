import {QdrantClient} from '@qdrant/js-client-rest';

const qdrantClient = new QdrantClient({url: 'http://127.0.0.1:6333'});

export default qdrantClient;
