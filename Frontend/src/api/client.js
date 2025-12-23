import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient(import.meta.env.VITE_API_URL, {
    credentials: 'include',
})

export default client;