-- This query is used to fetch all messages from a thread, based on the table structure provided by LangGraph's checkpointer.

WITH kwargs AS (
    SELECT 
        COALESCE(
            metadata->'writes'->'__start__'->'messages'->0->'kwargs',
            metadata->'writes'->'invoke_model'->'messages'->0->'kwargs',
            metadata->'writes'->'invoke_tools'->'messages'->0->'kwargs'
        ) AS kwargs,
        (metadata->>'step')::int AS step
    FROM checkpoints
    WHERE metadata->>'thread_id' = $1
),
messages AS (
    SELECT 
        kwargs->>'type' AS type,
        kwargs->>'content' AS content,
        step
    FROM kwargs
)
SELECT *
FROM messages
WHERE content IS NOT NULL
AND type IS NOT NULL
ORDER BY step;