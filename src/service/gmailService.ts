export const fetchUnreadEmailCount = async (token: string): Promise<number> => {
  try {
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels/UNREAD', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.messagesUnread ?? 0;
    } else {
      if (response.status === 401) {
        localStorage.removeItem('google_workspace_access_token');
        localStorage.removeItem('google_workspace_token_expiry');
      }
      return 0;
    }
  } catch (error) {
    console.error("Erreur récupération e-mails non lus:", error);
    return 0;
  }
};