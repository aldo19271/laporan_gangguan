import { neon } from '@neondatabase/serverless';
export default neon(process.env.DATABASE_URL);