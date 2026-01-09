-- Add deleted_at and last_restored_at columns to Conversation_Participants table
-- This allows users to soft-delete conversations (hide them) without affecting other participants
-- When a new message arrives, the conversation will be restored (deleted_at set to NULL)
-- last_restored_at tracks when conversation was restored, so only new messages are shown

ALTER TABLE Conversation_Participants 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

ALTER TABLE Conversation_Participants 
ADD COLUMN IF NOT EXISTS last_restored_at TIMESTAMPTZ NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversation_participants_deleted_at 
ON Conversation_Participants(conversation_id, employee_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_last_restored_at 
ON Conversation_Participants(conversation_id, employee_id, last_restored_at);

COMMENT ON COLUMN Conversation_Participants.deleted_at IS 'Timestamp when user deleted/hid this conversation. NULL means conversation is visible. When new messages arrive, this is set to NULL to restore the conversation.';
COMMENT ON COLUMN Conversation_Participants.last_restored_at IS 'Timestamp when conversation was last restored after being deleted. Used to filter messages - only messages after this timestamp are shown (like WhatsApp behavior).';

