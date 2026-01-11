import React, { useState } from "react";
import { Input, Button, Spinner } from "reactstrap";
import SimpleBar from "simplebar-react";
import { Link } from "react-router-dom";
import { useRole } from "../../helpers/useRole";

const ConversationList = ({
  conversations,
  currentConversation,
  onConversationSelect,
  onCreateConversation,
  onDeleteConversation,
  loading,
  currentUser
}) => {
  const { isOrgExecutive } = useRole(); // Read-only check
  const [searchTerm, setSearchTerm] = useState("");

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conversation =>
    conversation.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getConversationIcon = (type) => {
    switch(type) {
      case "Group":
        return "bx-group";
      case "Direct":
        return "bx-user";
      default:
        return "bx-chat";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Calculate difference in days
    const diffTime = today - messageDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // If today, show time in 12-hour format (e.g., "03:25 PM")
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    // Yesterday
    if (diffDays === 1) {
      return "Yesterday";
    }
    
    // 2-6 days ago
    if (diffDays >= 2 && diffDays < 7) {
      return `${diffDays} days ago`;
    }
    
    // Calculate weeks
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks === 1) {
      return "1 week ago";
    }
    if (diffWeeks >= 2 && diffWeeks < 4) {
      return `${diffWeeks} weeks ago`;
    }
    
    // Calculate months
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) {
      return "1 month ago";
    }
    if (diffMonths >= 2 && diffMonths < 12) {
      return `${diffMonths} months ago`;
    }
    
    // For very old dates, show the actual date
    const diffYears = Math.floor(diffDays / 365);
    if (diffYears >= 1) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    // Fallback
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="chat-leftsidebar me-lg-4">
      <div>
        {/* Header */}
        <div className="py-4 border-bottom">
          <div className="d-flex align-items-center">
            <div className="flex-grow-1">
              <h5 className="font-size-16 mb-0">Conversations</h5>
              <p className="text-muted mb-0">
                <i className="mdi mdi-circle text-success align-middle me-1"></i>
                {currentUser?.name || "User"}
              </p>
            </div>
            <div>
              {/* Org Executive can create conversations */}
              <Button
                color="primary"
                size="sm"
                onClick={onCreateConversation}
                title="New Conversation"
              >
                <i className="bx bx-plus"></i>
              </Button>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className="search-box chat-search-box py-4">
          <div className="position-relative">
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="bx bx-search-alt search-icon"></i>
          </div>
        </div>

        {/* Conversations List */}
        <div className="chat-leftsidebar-nav">
          {loading ? (
            <div className="text-center py-5">
              <Spinner color="primary" />
              <div className="mt-2 text-muted">Loading conversations...</div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-5">
              <i className="bx bx-chat display-4 text-muted mb-3 d-block"></i>
              <h5 className="text-muted">No conversations found</h5>
              <p className="text-muted">Start a new conversation</p>
              <Button color="primary" size="sm" onClick={onCreateConversation}>
                <i className="bx bx-plus me-1"></i>
                New Conversation
              </Button>
            </div>
          ) : (
            <SimpleBar style={{ maxHeight: "calc(100vh - 400px)", position: 'relative' }}>
              <ul className="list-unstyled chat-list" style={{ position: 'relative' }}>
                {filteredConversations.map((conversation) => (
                  <li
                    key={conversation.id}
                    className={currentConversation?.id === conversation.id ? "active" : ""}
                    style={{ position: 'relative', overflow: 'hidden' }}
                  >
                    <div className="d-flex align-items-start" style={{ position: 'relative', width: '100%', padding: '12px', overflow: 'hidden' }}>
                      <Link
                        to="#"
                        onClick={(e) => {
                          e.preventDefault();
                          onConversationSelect(conversation);
                        }}
                        className="d-flex align-items-start flex-grow-1"
                        style={{ textDecoration: 'none', color: 'inherit', minWidth: 0, overflow: 'hidden' }}
                      >
                        <div className="avatar-xs me-3 align-self-center flex-shrink-0">
                          <span className="avatar-title rounded-circle bg-primary text-white">
                            <i className={`bx ${getConversationIcon(conversation.type)}`}></i>
                          </span>
                        </div>

                        <div className="flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <h5 className="text-truncate font-size-14 mb-0">
                              {conversation.type === "Direct" 
                                ? (conversation.participant_names || "Unknown User")
                                : (conversation.title || "Untitled Conversation")
                              }
                            </h5>
                            {(conversation.unread_count && Number(conversation.unread_count) > 0) && (
                              <span 
                                className="badge rounded-pill d-flex align-items-center justify-content-center flex-shrink-0" 
                                style={{ 
                                  backgroundColor: '#28a745', 
                                  color: 'white',
                                  fontSize: '0.65rem', 
                                  minWidth: '18px',
                                  height: '18px',
                                  padding: '0 6px',
                                  fontWeight: '600',
                                  lineHeight: '1'
                                }}
                              >
                                {Number(conversation.unread_count) > 99 ? '99+' : Number(conversation.unread_count)}
                              </span>
                            )}
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <p className="text-truncate mb-0 text-muted font-size-12">
                              <i className={`bx ${getConversationIcon(conversation.type)} me-1`}></i>
                              {conversation.type || "Chat"} - {formatDate(conversation.updated_at)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </SimpleBar>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationList;

