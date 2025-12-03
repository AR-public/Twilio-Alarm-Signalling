import { useState, useEffect } from 'react';
import './App.css';
// import Timer from './components/timer';
// import AlertTable from './components/alertTable';

// type AlerteeResponse = '' | 'WAITING' | 'YES';

interface Alertee {
  name: string;
  phone: string;
  activationDelay: number; // in seconds
  isActive: boolean;
  response: 'WAITING' | 'YES';
}

function App() {
  const [isAlarmTriggered, setIsAlarmTriggered] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  // const [inputValue, setInputValue] = useState('');
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

  const handleTriggerAlarm = async () => {
    setIsAlarmTriggered(true);
    setTimeElapsed(0);

    // Reset alertees
    setAlertees((prev) =>
      prev.map((alertee) => ({
        ...alertee,
        isActive: alertee.activationDelay === 0,
        response: 'WAITING',
      }))
    );
  };

  const handleResetAlarm = async () => {
    setIsAlarmTriggered(false);
    setTimeElapsed(0);
    // setInputValue('');
    setAlertees((prev) =>
      prev.map((alertee) => ({
        ...alertee,
        isActive: false,
        response: 'WAITING',
      }))
    );
  };

  // function handleTextResponse(textResponse: string) {
  //   console.log('Text response received:', textResponse);
  //   if (textResponse.toLowerCase() === 'yes') {
  //     const updatedAlertees = alertees;
  //     updatedAlertees[0].response = 'YES';
  //     setAlertees(updatedAlertees);
  //   } else {
  //     return;
  //   }
  // }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

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
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-2xl py-6 px-12 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Trigger Alarm
              </button>
            ) : (
              <>
                <div className="text-center animate-fade-in">
                  <button
                    disabled
                    className="bg-red-500 text-white font-bold text-2xl py-6 px-12 rounded-xl shadow-lg mb-4"
                  >
                    Alarm Triggered!
                  </button>

                  <div className="text-3xl font-mono font-bold text-gray-700 mb-4">
                    Time Since Alarm: {formatTime(timeElapsed)}
                  </div>

                  <button
                    onClick={handleResetAlarm}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold text-lg py-3 px-8 rounded-lg shadow transition-all duration-300"
                  >
                    Reset Alarm
                  </button>

                  {/* <p>Send Test Text</p>
                  <input
                    onChange={(e) => setInputValue(e.target.value)}
                  ></input>
                  <button
                    onClick={() => handleTextResponse(inputValue)}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold text-lg py-3 px-8 rounded-lg shadow transition-all duration-300"
                  >
                    Send Text
                  </button> */}
                </div>

                <div className="w-full mt-6 animate-fade-in">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-6 py-3 text-left font-bold text-gray-700">
                          Alertees
                        </th>
                        <th className="border border-gray-300 px-6 py-3 text-left font-bold text-gray-700">
                          Response
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {alertees.map((alertee) => (
                        <tr
                          key={alertee.name}
                          className={`${
                            alertee.isActive ? 'bg-white' : 'bg-gray-50'
                          } transition-all duration-500`}
                        >
                          <td
                            className={`border border-gray-300 px-6 py-4 ${
                              alertee.isActive
                                ? 'text-gray-800 font-medium'
                                : 'text-gray-400'
                            }`}
                          >
                            {alertee.name}
                          </td>
                          <td
                            className={`border border-gray-300 px-6 py-4 font-bold ${
                              alertee.isActive
                                ? alertee.response === 'YES'
                                  ? 'text-green-600'
                                  : 'text-orange-600'
                                : 'text-gray-400'
                            }`}
                          >
                            {alertee.isActive ? alertee.response : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

export default App;
