import { useState, useEffect } from 'react';
import './App.css';
import { functions, ALARM_FUNCTION_ID } from './lib/appwrite';
import { ExecutionMethod } from 'appwrite';
import { Client, Databases, Query } from 'appwrite';

interface Alertee {
  name: string;
  phone: string;
  activationDelay: number; // in seconds
  isActive: boolean;
  response: 'WAITING' | 'YES';
}

interface FloatingMessage {
  id: string;
  text: string;
  phone: string;
}

function App() {
  const [isAlarmTriggered, setIsAlarmTriggered] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [timeAlarmTriggered, setTimeAlarmTriggered] = useState<string>(
    new Date().toISOString()
  );
  const [alertees, setAlertees] = useState<Alertee[]>([
    {
      name: 'Supervisor 1',
      phone: '+447847791683',
      activationDelay: 0,
      isActive: false,
      response: 'WAITING',
    },
  ]);
  const [floatingMessages, setFloatingMessages] = useState<FloatingMessage[]>(
    []
  );
  const [, setShownMessageIds] = useState<Set<string>>(new Set());

  const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1') // Appwrite Project Endpoint
    .setProject('69162129001603cdec51'); // Project ID

  const databases = new Databases(client);

  async function getDbResponses() {
    console.log('inside getDbResponses at:', timeAlarmTriggered);
    console.log("alertees state:", alertees);
    const result = await databases.listDocuments({
      databaseId: '69315e3800250c261f77',
      collectionId: 'responses_table',
      queries: [Query.createdAfter(timeAlarmTriggered)],
      total: false,
    });

    console.log('All database values after alarm triggered:', result);
    const allResponsesSinceAlarmTriggered = result.documents;

    allResponsesSinceAlarmTriggered.forEach((doc) => {
      if (doc.response.toLowerCase().trim() === 'yes') {
        setAlertees((prevAlertees) =>
          prevAlertees.map((alertee) =>
            alertee.phone === doc.phone
              ? { ...alertee, response: 'YES' }
              : alertee
          )
        );
      } else {
        // Add non-YES responses as floating messages
        const messageId = `${doc.phone}-${doc.$createdAt}-${doc.response}`;

        // Only show if we haven't shown this message before
        setShownMessageIds((prevShown) => {
          if (prevShown.has(messageId)) {
            return prevShown;
          }

          // Add to shown messages
          const newShown = new Set(prevShown);
          newShown.add(messageId);

          // Add to floating messages for display
          setFloatingMessages((prev) => [
            ...prev,
            {
              id: messageId,
              text: doc.response,
              phone: doc.phone,
            },
          ]);

          // Remove message after animation completes (4 seconds)
          setTimeout(() => {
            setFloatingMessages((prev) =>
              prev.filter((msg) => msg.id !== messageId)
            );
          }, 4000);

          return newShown;
        });
      }
    });
  }

  useEffect(() => {
    let interval = null;

    if (isAlarmTriggered) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAlarmTriggered]);

  useEffect(() => {
    if (!isAlarmTriggered || !timeAlarmTriggered) return;

    let isCancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const run = async () => {
      try {
        const result = await getDbResponses();
        if (isCancelled) return;
        console.log('Polled responses:', result);
      } catch (err) {
        console.error('Polling getDbResponses failed:', err);
      }
    };

    // Wait 5 seconds before starting the interval
    timeoutId = setTimeout(() => {
      // First run happens at 5s
      run();
      // Then keep running every 3s
      intervalId = setInterval(run, 3000);
    }, 5000);

    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAlarmTriggered, timeAlarmTriggered]);

  const triggerAppwriteFunction = async (alertee: Alertee) => {
    try {
      const requestBody = JSON.stringify({
        to: alertee.phone,
      });

      const execution = await functions.createExecution(
        ALARM_FUNCTION_ID,
        requestBody,
        false,
        '/',
        ExecutionMethod.POST
      );

      console.log('Function execution response:', execution);

      if (execution.responseStatusCode === 200) {
        console.log(`SMS sent successfully to ${alertee.name}`);
        return { success: true, execution };
      } else {
        console.error(
          `Failed to send SMS to ${alertee.name}:`,
          execution.responseBody
        );
        return { success: false, execution };
      }
    } catch (error) {
      console.error(`Error triggering function for ${alertee.name}:`, error);
      return { success: false, error };
    }
  };

  const handleTriggerAlarm = async () => {
    setIsAlarmTriggered(true);
    setTimeElapsed(0);
    setIsSending(true);
    setTimeAlarmTriggered(new Date().toISOString());
    setFloatingMessages([]); // Clear any previous messages

    setAlertees((prev) =>
      prev.map((alertee) => ({
        ...alertee,
        isActive: alertee.activationDelay === 0,
        response: 'WAITING',
      }))
    );

    const activeAlertees = alertees.filter((a) => a.activationDelay === 0);

    try {
      const results = await Promise.allSettled(
        activeAlertees.map((alertee) => triggerAppwriteFunction(alertee))
      );

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          console.log(`✓ SMS sent to ${activeAlertees[index].name}`);
        } else {
          console.error(
            `✗ Failed to send SMS to ${activeAlertees[index].name}`
          );
        }
      });
    } catch (error) {
      console.error('Error sending SMS alerts:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleResetAlarm = async () => {
    setIsAlarmTriggered(false);
    setTimeElapsed(0);
    setFloatingMessages([]); // Clear messages
    setAlertees((prev) =>
      prev.map((alertee) => ({
        ...alertee,
        isActive: false,
        response: 'WAITING',
      }))
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="alarm-container">
      <div className="alarm-wrapper">
        <div className="alarm-header">
          <h1 className="alarm-title">Alarm Dashboard</h1>
          <p className="alarm-subtitle">Emergency alert system</p>
        </div>

        <div className="alarm-content-wrapper">
          <div className="alarm-card">
            <div className="alarm-card-content">
              {!isAlarmTriggered ? (
                <div className="idle-state">
                  <div>
                    <p className="idle-text">
                      Press the button below to trigger the alarm
                    </p>
                  </div>
                  <button
                    onClick={handleTriggerAlarm}
                    disabled={isSending}
                    className="trigger-button"
                  >
                    {isSending ? 'Sending...' : 'Trigger Alarm'}
                  </button>
                </div>
              ) : (
                <div className="triggered-state">
                  <div className="status-section">
                    <div className="alarm-badge">
                      <span className="alarm-icon">🚨</span>
                      Alarm Triggered!
                    </div>

                    <div className="timer-box">
                      <p className="timer-label">Time Elapsed</p>
                      <div className="timer-display">
                        {formatTime(timeElapsed)}
                      </div>
                    </div>
                  </div>

                  <div className="alert-status-section">
                    <h2 className="section-title">Alert Status</h2>
                    <div className="table-container">
                      <table className="alert-table">
                        <thead>
                          <tr>
                            <th>Alertee</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {alertees.map((alertee) => (
                            <tr
                              key={alertee.name}
                              className={
                                alertee.isActive ? 'active' : 'inactive'
                              }
                            >
                              <td>
                                <span
                                  className={`alertee-name ${
                                    alertee.isActive ? '' : 'inactive'
                                  }`}
                                >
                                  {alertee.name}
                                </span>
                              </td>
                              <td>
                                {alertee.isActive ? (
                                  <span
                                    className={`status-badge ${
                                      alertee.response === 'YES'
                                        ? 'acknowledged'
                                        : 'waiting'
                                    }`}
                                  >
                                    {alertee.response === 'YES' ? (
                                      <>
                                        <span className="status-badge-icon">
                                          ✓
                                        </span>
                                        Acknowledged
                                      </>
                                    ) : (
                                      <>
                                        <span className="status-badge-icon">
                                          ⏳
                                        </span>
                                        Waiting
                                      </>
                                    )}
                                  </span>
                                ) : (
                                  <span className="status-inactive">
                                    Inactive
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="reset-section">
                    <button onClick={handleResetAlarm} className="reset-button">
                      Reset Alarm
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Floating Messages Container */}
          {isAlarmTriggered && floatingMessages.length > 0 && (
            <div className="floating-messages-container">
              <div key={floatingMessages[0].id} className="floating-message">
                {floatingMessages[0].text}
              </div>
            </div>
          )}
        </div>

        <div className="alarm-footer">Happy Fuel Co 🔥😇</div>
      </div>
    </div>
  );
}

export default App;
