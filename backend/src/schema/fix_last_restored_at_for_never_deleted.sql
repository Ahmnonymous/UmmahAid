-- Fix last_restored_at for conversations that were never deleted
-- If a conversation was never deleted (deleted_at IS NULL), last_restored_at should also be NULL
-- This ensures all messages are shown for conversations that were never deleted

UPDATE Conversation_Participants
SET last_restored_at = NULL
WHERE deleted_at IS NULL 
  AND last_restored_at IS NOT NULL;

COMMENT ON COLUMN Conversation_Participants.last_restored_at IS 'Timestamp when conversation was last restored after being deleted. NULL means conversation was never deleted (show all messages). If set, only show messages created after this timestamp.';

