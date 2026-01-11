import React, { useState, useEffect } from "react";
import { Container, Row, Col, Alert } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";
import { getAuditName } from "../../helpers/userStorage";
import { useRole } from "../../helpers/useRole";

// Import Components
import ConversationList from "./ConversationList";
import MessageArea from "./MessageArea";
import NewConversationModal from "./NewConversationModal";

const Chat = () => {
  // State management
  const [conversations, setConversations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  
  // Modal states
  const [newConversationModal, setNewConversationModal] = useState(false);
  
  // Alert state
  const [alert, setAlert] = useState(null);

  const { user: currentUser, centerId, isGlobalAdmin, isAppAdmin, isHQ, isOrgAdmin, isCaseworker, userType } = useRole();

  // Meta title
  document.title = "Chat | UmmahAid";

  // Fetch conversations and employees on mount
  useEffect(() => {
    fetchConversations();
    fetchEmployees();
  }, []);

  // Fetch messages when conversation changes and mark as read
  useEffect(() => {
    if (currentConversation && currentUser?.id) {
      fetchMessages(currentConversation.id);
      // Mark as read after a short delay to ensure messages are loaded
      // Per-participant tracking now handles announcements correctly
      const timer = setTimeout(() => {
        markConversationAsRead(currentConversation.id);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axiosApi.get(`${API_BASE_URL}/conversations`);
      
      // ✅ Backend now handles filtering correctly:
      // - Filters by participant (user must be in Conversation_Participants)
      // - For users with center_id: Shows conversations where center_id matches OR center_id IS NULL
      //   This allows Org Admin/Caseworker to see conversations created by App Admin/HQ
      // - App Admin (center_id = null) sees all conversations they're a participant in
      setConversations(response.data);
      
      // ✅ User must manually select a conversation - no auto-selection
    } catch (error) {
      console.error("Error fetching conversations:", error);
      showAlert("Failed to load conversations", "danger");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axiosApi.get(`${API_BASE_URL}/employee`);

      // App Admin and HQ (center_id = null) need to see all employees (across all centers) 
      // to initiate conversations with Org Admin and Caseworker from any center
      // Org Admin and Caseworker only see employees from their own center
      let centerEmployees;
      if (isGlobalAdmin || centerId === null || centerId === undefined) {
        // App Admin and HQ (who have center_id = null) see all employees
        centerEmployees = response.data;
      } else {
        // Org Admin and Caseworker only see employees from their own center
        centerEmployees = response.data.filter(
          (employee) =>
            String(employee.center_id ?? "") === String(centerId ?? "")
        );
      }

      setEmployees(centerEmployees);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setMessagesLoading(true);
      // ✅ Pass conversation_id as query parameter - backend will filter by participant
      const response = await axiosApi.get(`${API_BASE_URL}/messages${conversationId ? `?conversation_id=${conversationId}` : ''}`);
      
      // Backend now handles filtering by participant, so we can use the response directly
      // Sort by created_at
      const sortedMessages = response.data.sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      );

      setMessages(sortedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      showAlert("Failed to load messages", "danger");
    } finally {
      setMessagesLoading(false);
    }
  };

  const markConversationAsRead = async (conversationId) => {
    try {
      if (!conversationId || !currentUser?.id) return;
      
      await axiosApi.post(`${API_BASE_URL}/messages/conversation/${conversationId}/mark-read`);
      
      // Refresh conversations to update unread counts after marking as read
      // Use a small delay to ensure the database update is complete
      setTimeout(() => {
        fetchConversations();
      }, 300);
    } catch (error) {
      console.error("Error marking conversation as read:", error);
      // Don't show alert for this - it's a background operation
    }
  };

  const showAlert = (message, color = "success") => {
    setAlert({ message, color });
    setTimeout(() => setAlert(null), 4000);
  };

  const getAlertIcon = (color) => {
    switch (color) {
      case "success":
        return "mdi mdi-check-all";
      case "danger":
        return "mdi mdi-block-helper";
      case "warning":
        return "mdi mdi-alert-outline";
      case "info":
        return "mdi mdi-alert-circle-outline";
      default:
        return "mdi mdi-information";
    }
  };

  const getAlertBackground = (color) => {
    switch (color) {
      case "success":
        return "#d4edda";
      case "danger":
        return "#f8d7da";
      case "warning":
        return "#fff3cd";
      case "info":
        return "#d1ecf1";
      default:
        return "#f8f9fa";
    }
  };

  const getAlertBorder = (color) => {
    switch (color) {
      case "success":
        return "#c3e6cb";
      case "danger":
        return "#f5c6cb";
      case "warning":
        return "#ffeaa7";
      case "info":
        return "#bee5eb";
      default:
        return "#dee2e6";
    }
  };

  const handleConversationSelect = (conversation) => {
    setCurrentConversation(conversation);
  };

  const handleSendMessage = async (messageData) => {
    const tempMessageId = `temp-${Date.now()}`;
    
    try {
      const payload = {
        conversation_id: currentConversation.id,
        sender_id: currentUser?.id,
        message_text: messageData.message_text,
        read_status: "Unread",
        center_id: centerId ?? null, // Backend will handle App Admin (null center_id)
        created_by: getAuditName(),
      };

      // Optimistic update - add message to UI immediately
      const tempMessage = {
        id: tempMessageId,
        ...payload,
        created_at: new Date().toISOString(),
        attachment_filename: messageData.file ? messageData.file.name : null,
      };
      setMessages(prev => [...prev, tempMessage]);

      // Handle file attachment if present
      if (messageData.file) {
        const formData = new FormData();
        formData.append("conversation_id", payload.conversation_id);
        formData.append("sender_id", payload.sender_id);
        formData.append("message_text", payload.message_text);
        formData.append("read_status", payload.read_status);
        // Only append center_id if it's not null (App Admin has null center_id)
        if (centerId !== null && centerId !== undefined) {
          formData.append("center_id", centerId);
        }
        formData.append("created_by", payload.created_by);
        formData.append("attachment", messageData.file);

        await axiosApi.post(`${API_BASE_URL}/messages`, formData);
      } else {
        await axiosApi.post(`${API_BASE_URL}/messages`, payload);
      }

      // Refresh messages from server to get the actual ID and any server-side updates
      await fetchMessages(currentConversation.id);
      
      // ✅ Refresh conversation list to show restored conversations
      // When a message is sent, the backend restores deleted conversations,
      // so we need to refresh the list to see them appear
      await fetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      showAlert("Failed to send message", "danger");
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessageId));
    }
  };

  const handleCreateConversation = async (conversationData) => {
    try {
      const payload = {
        title: conversationData.title,
        type: conversationData.type,
        center_id: centerId ?? null,
        created_by: getAuditName(),
      };

      const response = await axiosApi.post(`${API_BASE_URL}/conversations`, payload);
      const newConversation = response.data;

      const creatorId = currentUser?.id;
      
      // For Announcement conversations: Auto-add all eligible users (App Admin, HQ, Org Admin, Caseworker)
      // Exclude Org Executives (user_type 4) as they don't have Chat access
      if (conversationData.type === "Announcement") {
        // Get all eligible employees (excluding Org Executives)
        const eligibleEmployees = employees.filter(employee => {
          const empUserType = employee.user_type || employee.User_Type || employee.userType;
          // Include App Admin (1), HQ (2), Org Admin (3), Caseworker (5)
          // Exclude Org Executive (4)
          return empUserType == 1 || empUserType == 2 || empUserType == 3 || empUserType == 5 ||
                 empUserType === "1" || empUserType === "2" || empUserType === "3" || empUserType === "5";
        });

        // Add all eligible employees as participants
        // Use each participant's center_id (not the creator's center_id)
        for (const employee of eligibleEmployees) {
          const participantCenterId = employee.center_id ?? null;
          await axiosApi.post(`${API_BASE_URL}/conversationParticipants`, {
            conversation_id: newConversation.id,
            employee_id: employee.id,
            joined_date: new Date().toISOString().split('T')[0],
            center_id: participantCenterId, // Use participant's center_id, not creator's
            created_by: getAuditName(),
          });
        }
      } else {
        // For Direct and Group conversations: Add creator and selected participants
        // ✅ Always add the creator as a participant so they can see the conversation
        if (creatorId) {
          await axiosApi.post(`${API_BASE_URL}/conversationParticipants`, {
            conversation_id: newConversation.id,
            employee_id: creatorId,
            joined_date: new Date().toISOString().split('T')[0],
            center_id: centerId ?? null,
            created_by: getAuditName(),
          });
        }

        // Add other participants
        if (conversationData.participants && conversationData.participants.length > 0) {
          for (const employeeId of conversationData.participants) {
            // Skip if the participant is the same as the creator (already added above)
            if (employeeId == creatorId) continue;
            
            // Find the participant employee to get their center_id
            const participantEmployee = employees.find(emp => emp.id == employeeId);
            const participantCenterId = participantEmployee?.center_id ?? null;
            
            await axiosApi.post(`${API_BASE_URL}/conversationParticipants`, {
              conversation_id: newConversation.id,
              employee_id: employeeId,
              joined_date: new Date().toISOString().split('T')[0],
              center_id: participantCenterId, // Use participant's center_id, not creator's
              created_by: getAuditName(),
            });
          }
        }
      }

      showAlert("Conversation created successfully", "success");
      fetchConversations();
      setNewConversationModal(false);
    } catch (error) {
      console.error("Error creating conversation:", error);
      showAlert("Failed to create conversation", "danger");
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    try {
      await axiosApi.delete(`${API_BASE_URL}/conversations/${conversationId}`);
      showAlert("Conversation deleted successfully", "success");
      fetchConversations();
      
      // Clear current conversation if it was deleted
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      showAlert("Failed to delete conversation", "danger");
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Apps" breadcrumbItem="Chat" />

          {/* Alert Notification - Top Right */}
          {alert && (
            <div
              className="position-fixed top-0 end-0 p-3"
              style={{ zIndex: 1060, minWidth: "300px", maxWidth: "500px" }}
            >
              <Alert
                color={alert.color}
                isOpen={!!alert}
                toggle={() => setAlert(null)}
                className="alert-dismissible fade show shadow-lg"
                role="alert"
                style={{
                  opacity: 1,
                  backgroundColor: getAlertBackground(alert.color),
                  border: `1px solid ${getAlertBorder(alert.color)}`,
                  color: "#000",
                }}
              >
                <i className={`${getAlertIcon(alert.color)} me-2`}></i>
                {alert.message}
              </Alert>
            </div>
          )}

          <Row>
            <Col lg="12">
              <div className="d-lg-flex">
                {/* Conversation List - Left Sidebar */}
                <ConversationList
                  conversations={conversations}
                  currentConversation={currentConversation}
                  onConversationSelect={handleConversationSelect}
                  onCreateConversation={() => setNewConversationModal(true)}
                  onDeleteConversation={handleDeleteConversation}
                  loading={loading}
                  currentUser={currentUser}
                />

                {/* Message Area - Main Content */}
                <MessageArea
                  conversation={currentConversation}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onDeleteConversation={handleDeleteConversation}
                  loading={messagesLoading}
                  currentUser={currentUser}
                />
              </div>
            </Col>
          </Row>

          {/* Modals */}
          <NewConversationModal
            isOpen={newConversationModal}
            toggle={() => setNewConversationModal(!newConversationModal)}
            employees={employees}
            currentUser={currentUser}
            onSubmit={handleCreateConversation}
            showAlert={showAlert}
            isAppAdmin={isAppAdmin}
            isHQ={isHQ}
            isOrgAdmin={isOrgAdmin}
            isCaseworker={isCaseworker}
            userType={userType}
          />
        </Container>
      </div>
    </React.Fragment>
  );
};

export default Chat;

