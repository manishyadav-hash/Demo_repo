
const { Pool } = require("pg");
const { Env } = require("../config/env.config");

const pool = new Pool({
    host: Env.PG_HOST,
    port: Number(Env.PG_PORT),
    user: Env.PG_USER,
    password: Env.PG_PASSWORD,
    database: Env.PG_DATABASE,
});

const query = (text, params = [], client = null) => {
    const executor = client || pool;
    return executor.query(text, params);
};

const withClient = async (work) => {
    const client = await pool.connect();
    try {
        return await work(client);
    }
    finally {
        client.release();
    }
};

const withTransaction = async (work) => {
    return withClient(async (client) => {
        await client.query("BEGIN");
        try {
            const result = await work(client);
            await client.query("COMMIT");
            return result;
        }
        catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
    });
};

module.exports = {
    pool,
    query,
    withClient,
    withTransaction,
};
