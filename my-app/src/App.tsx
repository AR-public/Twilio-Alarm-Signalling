// Below works for triggering SMS but lacks response checking

// import { useState, useEffect } from 'react';
// import './App.css';
// import { functions, ALARM_FUNCTION_ID } from './lib/appwrite';
// import { ExecutionMethod } from 'appwrite';
// // import Timer from './components/timer';
// // import AlertTable from './components/alertTable';

// // type AlerteeResponse = '' | 'WAITING' | 'YES';

// interface Alertee {
//   name: string;
//   phone: string;
//   activationDelay: number; // in seconds
//   isActive: boolean;
//   response: 'WAITING' | 'YES';
// }

// function App() {
//   const [isAlarmTriggered, setIsAlarmTriggered] = useState(false);
//   const [timeElapsed, setTimeElapsed] = useState(0);
//   const [isSending, setIsSending] = useState(false);
//   // const [inputValue, setInputValue] = useState('');
//   const [alertees, setAlertees] = useState<Alertee[]>([
//     {
//       name: 'Supervisor 1',
//       phone: '+447847791683',
//       activationDelay: 0,
//       isActive: false,
//       response: 'WAITING',
//     },
//   ]);

//   // Timer effect
//   useEffect(() => {
//     let interval = null;

//     if (isAlarmTriggered) {
//       interval = setInterval(() => {
//         setTimeElapsed((prev) => prev + 1);
//       }, 1000);
//     }

//     return () => {
//       if (interval) clearInterval(interval);
//     };
//   }, [isAlarmTriggered]);

//   const triggerAppwriteFunction = async (alertee: Alertee) => {
//     try {
//       // Prepare the request body with override parameters
//       const requestBody = JSON.stringify({
//         to: alertee.phone,
//         // from and body will use env defaults if not specified
//         // Optionally override them here:
//         // from: '+1234567890',
//         // body: `Alarm Triggered for ${alertee.name}. Reply 'YES' to acknowledge.`
//       });

//       // Execute the Appwrite function
//       const execution = await functions.createExecution(
//         ALARM_FUNCTION_ID,
//         requestBody,
//         false, // async execution (set to true if you don't need to wait)
//         '/', // path
//         ExecutionMethod.POST // HTTP method
//       );

//       console.log('Function execution response:', execution);

//       // Check if the execution was successful
//       if (execution.responseStatusCode === 200) {
//         console.log(`SMS sent successfully to ${alertee.name}`);
//         return { success: true, execution };
//       } else {
//         console.error(
//           `Failed to send SMS to ${alertee.name}:`,
//           execution.responseBody
//         );
//         return { success: false, execution };
//       }
//     } catch (error) {
//       console.error(`Error triggering function for ${alertee.name}:`, error);
//       return { success: false, error };
//     }
//   };

//   const handleTriggerAlarm = async () => {
//     setIsAlarmTriggered(true);
//     setTimeElapsed(0);
//     setIsSending(true);

//     // Reset alertees
//     setAlertees((prev) =>
//       prev.map((alertee) => ({
//         ...alertee,
//         isActive: alertee.activationDelay === 0,
//         response: 'WAITING',
//       }))
//     );

//     // Send SMS to all active alertees
//     const activeAlertees = alertees.filter((a) => a.activationDelay === 0);

//     try {
//       // Send SMS in parallel to all active alertees
//       const results = await Promise.allSettled(
//         activeAlertees.map((alertee) => triggerAppwriteFunction(alertee))
//       );

//       results.forEach((result, index) => {
//         if (result.status === 'fulfilled' && result.value.success) {
//           console.log(`✓ SMS sent to ${activeAlertees[index].name}`);
//         } else {
//           console.error(
//             `✗ Failed to send SMS to ${activeAlertees[index].name}`
//           );
//         }
//       });
//     } catch (error) {
//       console.error('Error sending SMS alerts:', error);
//     } finally {
//       setIsSending(false);
//     }
//   };

//   const handleResetAlarm = async () => {
//     setIsAlarmTriggered(false);
//     setTimeElapsed(0);
//     // setInputValue('');
//     setAlertees((prev) =>
//       prev.map((alertee) => ({
//         ...alertee,
//         isActive: false,
//         response: 'WAITING',
//       }))
//     );
//   };

//   // function handleTextResponse(textResponse: string) {
//   //   console.log('Text response received:', textResponse);
//   //   if (textResponse.toLowerCase() === 'yes') {
//   //     const updatedAlertees = alertees;
//   //     updatedAlertees[0].response = 'YES';
//   //     setAlertees(updatedAlertees);
//   //   } else {
//   //     return;
//   //   }
//   // }

//   const formatTime = (seconds: number): string => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, '0')}:${secs
//       .toString()
//       .padStart(2, '0')}`;
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-8">
//       <div className="max-w-2xl w-full">
//         <h1 className="text-5xl font-bold text-center mb-12 text-gray-800">
//           Alarm Signalling App
//         </h1>

//         <div className="bg-white rounded-2xl shadow-2xl p-8">
//           <div className="flex flex-col items-center gap-6">
//             {!isAlarmTriggered ? (
//               <button
//                 onClick={handleTriggerAlarm}
//                 disabled={isSending}
//                 className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-2xl py-6 px-12 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {isSending ? 'Sending...' : 'Trigger Alarm'}
//               </button>
//             ) : (
//               <>
//                 <div className="text-center animate-fade-in">
//                   <button
//                     disabled
//                     className="bg-red-500 text-white font-bold text-2xl py-6 px-12 rounded-xl shadow-lg mb-4"
//                   >
//                     Alarm Triggered!
//                   </button>

//                   <div className="text-3xl font-mono font-bold text-gray-700 mb-4">
//                     Time Since Alarm: {formatTime(timeElapsed)}
//                   </div>

//                   <button
//                     onClick={handleResetAlarm}
//                     className="bg-gray-600 hover:bg-gray-700 text-white font-bold text-lg py-3 px-8 rounded-lg shadow transition-all duration-300"
//                   >
//                     Reset Alarm
//                   </button>

//                   {/* <p>Send Test Text</p>
//                   <input
//                     onChange={(e) => setInputValue(e.target.value)}
//                   ></input>
//                   <button
//                     onClick={() => handleTextResponse(inputValue)}
//                     className="bg-gray-600 hover:bg-gray-700 text-white font-bold text-lg py-3 px-8 rounded-lg shadow transition-all duration-300"
//                   >
//                     Send Text
//                   </button> */}
//                 </div>

//                 <div className="w-full mt-6 animate-fade-in">
//                   <table className="w-full border-collapse">
//                     <thead>
//                       <tr className="bg-gray-100">
//                         <th className="border border-gray-300 px-6 py-3 text-left font-bold text-gray-700">
//                           Alertees
//                         </th>
//                         <th className="border border-gray-300 px-6 py-3 text-left font-bold text-gray-700">
//                           Response
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {alertees.map((alertee) => (
//                         <tr
//                           key={alertee.name}
//                           className={`${
//                             alertee.isActive ? 'bg-white' : 'bg-gray-50'
//                           } transition-all duration-500`}
//                         >
//                           <td
//                             className={`border border-gray-300 px-6 py-4 ${
//                               alertee.isActive
//                                 ? 'text-gray-800 font-medium'
//                                 : 'text-gray-400'
//                             }`}
//                           >
//                             {alertee.name}
//                           </td>
//                           <td
//                             className={`border border-gray-300 px-6 py-4 font-bold ${
//                               alertee.isActive
//                                 ? alertee.response === 'YES'
//                                   ? 'text-green-600'
//                                   : 'text-orange-600'
//                                 : 'text-gray-400'
//                             }`}
//                           >
//                             {alertee.isActive ? alertee.response : '—'}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       </div>

//       <style>{`
//         @keyframes fade-in {
//           from {
//             opacity: 0;
//             transform: translateY(-10px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         .animate-fade-in {
//           animation: fade-in 0.5s ease-out;
//         }
//       `}</style>
//     </div>
//   );
// }

// export default App;

// Below is the updated code with SMS response checking via webhook function
import { useState, useEffect } from 'react';
import { functions, ALARM_FUNCTION_ID, checkSmsResponse } from './lib/appwrite';
import { ExecutionMethod } from 'appwrite';
import './App.css';

interface Alertee {
  name: string;
  phone: string;
  activationDelay: number;
  isActive: boolean;
  response: 'WAITING' | 'YES';
}

function App() {
  const [isAlarmTriggered, setIsAlarmTriggered] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [alertees, setAlertees] = useState<Alertee[]>([
    {
      name: 'Supervisor 1',
      phone: '+447847791683',
      activationDelay: 0,
      isActive: false,
      response: 'WAITING',
    },
  ]);

  // Timer effect
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

  // Poll webhook function for SMS responses
  useEffect(() => {
    if (!isAlarmTriggered) return;

    const pollInterval = setInterval(async () => {
      // Check responses for all active alertees
      for (const alertee of alertees.filter((a) => a.isActive)) {
        if (alertee.response === 'YES') continue; // Skip if already acknowledged

        const response = await checkSmsResponse(alertee.phone);

        if (response && response.isAcknowledged) {
          // Update alertee status to YES
          setAlertees((prev) =>
            prev.map((a) =>
              a.phone === alertee.phone ? { ...a, response: 'YES' } : a
            )
          );

          console.log(`✓ ${alertee.name} acknowledged: ${response.response}`);
        }
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [isAlarmTriggered, alertees]);

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

  const allAcknowledged = alertees
    .filter((a) => a.isActive)
    .every((a) => a.response === 'YES');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <h1 className="text-5xl font-bold text-center mb-12 text-gray-800">
          Alarm Signalling App
        </h1>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center gap-6">
            {!isAlarmTriggered ? (
              <button
                onClick={handleTriggerAlarm}
                disabled={isSending}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-2xl py-6 px-12 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? 'Sending...' : 'Trigger Alarm'}
              </button>
            ) : (
              <>
                <div className="text-center animate-fade-in">
                  <button
                    disabled
                    className={`${
                      allAcknowledged ? 'bg-green-500' : 'bg-red-500'
                    } text-white font-bold text-2xl py-6 px-12 rounded-xl shadow-lg mb-4 transition-colors duration-300`}
                  >
                    {allAcknowledged
                      ? 'All Acknowledged ✓'
                      : 'Alarm Triggered!'}
                  </button>

                  <div className="text-3xl font-mono font-bold text-gray-700 mb-4">
                    Time Since Alarm: {formatTime(timeElapsed)}
                  </div>

                  <div className="mb-6 space-y-3">
                    {alertees
                      .filter((a) => a.isActive)
                      .map((alertee, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                            alertee.response === 'YES'
                              ? 'bg-green-50 border-green-400'
                              : 'bg-yellow-50 border-yellow-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-800">
                              {alertee.name}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-bold ${
                                alertee.response === 'YES'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-yellow-500 text-white animate-pulse'
                              }`}
                            >
                              {alertee.response === 'YES'
                                ? '✓ Acknowledged'
                                : 'Waiting...'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {alertee.phone}
                          </div>
                        </div>
                      ))}
                  </div>

                  <button
                    onClick={handleResetAlarm}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold text-lg py-3 px-8 rounded-lg shadow transition-all duration-300"
                  >
                    Reset Alarm
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
