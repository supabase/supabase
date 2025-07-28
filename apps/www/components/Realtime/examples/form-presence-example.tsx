'use client'

import { ExampleLayoutProps } from '../example-layout'

const instanceId = Math.random().toString(36).substring(2, 9)

const appJsCode = `import { useEffect, useState, useRef } from 'react';
import './styles.css';
import { createClient } from '@supabase/supabase-js';
import { useForm, Controller } from 'react-hook-form';

// Initialize Supabase client
const supabaseUrl = '${process.env.NEXT_PUBLIC_EXAMPLES_SUPABASE_URL}';
const supabaseKey = '${process.env.NEXT_PUBLIC_EXAMPLES_SUPABASE_ANON_KEY}';
const supabase = createClient(supabaseUrl, supabaseKey);

// Generate a random user ID and name
const userId = Math.random().toString(36).substring(2, 15);
const getRandomColor = () => {
  const colors = ['#FF5F5F', '#5F9EFF', '#5FFF8F', '#FF5FE0', '#FFC55F', '#AC5FFF'];
  return colors[Math.floor(Math.random() * colors.length)];
};
const userColor = getRandomColor();

// Channel name - using a unique ID to ensure both instances connect to the same channel
const CHANNEL = 'form-presence-${instanceId}';
const FORM_BROADCAST = 'form_data';
const FOCUS_BROADCAST = 'field_focus';
const SUBMIT_BROADCAST = 'form_submit';

export default function App() {
  const [activeUsers, setActiveUsers] = useState({});
  const [focusedFields, setFocusedFields] = useState({});
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submittedBy, setSubmittedBy] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);
  const localFormUpdateRef = useRef(false);
  const channelRef = useRef(null);
  const previousFormValues = useRef({});
  
  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      subtitle: '',
      url: '',
      description: '',
    }
  });
  
  const formValues = watch();

  useEffect(() => {
    // Generate a random username
    const adjectives = ['Happy', 'Clever', 'Brave', 'Bright', 'Kind'];
    const nouns = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Fox'];
    const randomName = \`\${adjectives[Math.floor(Math.random() * adjectives.length)]}\${
      nouns[Math.floor(Math.random() * nouns.length)]
    }\${Math.floor(Math.random() * 100)}\`;
    setUsername(randomName);

    // Save initial form values
    previousFormValues.current = { ...formValues };

    // Subscribe to presence channel
    const channel = supabase.channel(CHANNEL);
    channelRef.current = channel;

    // Track presence state
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const userMap = {};
        let count = 0;
        
        // Convert presence state to map
        Object.keys(state).forEach(key => {
          const presences = state[key];
          presences.forEach(presence => {
            userMap[presence.user_id] = {
              username: presence.username,
              color: presence.color,
              online_at: presence.online_at,
            };
            count++;
          });
        });
        
        setActiveUsers(userMap);
        setUserCount(count);
      })
      .on('broadcast', { event: FOCUS_BROADCAST }, (payload) => {
        // Update which fields are being focused by other users
        if (payload.payload.user_id !== userId) {
          setFocusedFields(prev => ({
            ...prev,
            [payload.payload.field]: payload.payload.isFocused ? {
              user_id: payload.payload.user_id,
              username: payload.payload.username,
              color: payload.payload.color
            } : null
          }));
        }
      })
      .on('broadcast', { event: FORM_BROADCAST }, (payload) => {
        // Update form data when received from other users
        if (payload.payload.user_id !== userId) {
          // Set flag to indicate this update is from remote
          localFormUpdateRef.current = true;
          
          // Update only changed fields
          Object.entries(payload.payload.formData).forEach(([field, value]) => {
            // Only update if the value actually changed
            if (value !== formValues[field]) {
              setValue(field, value);
            }
          });
          
          // Update previous form values
          previousFormValues.current = { ...payload.payload.formData };
          
          // Clear flag after a small delay to ensure React has processed the update
          setTimeout(() => {
            localFormUpdateRef.current = false;
          }, 50);
        }
      })
      .on('broadcast', { event: SUBMIT_BROADCAST }, (payload) => {
        // Update form submission status for all clients
        setFormSubmitted(true);
        setSubmittedBy(payload.payload.username);
        setSubmittedData(payload.payload.formData);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Send presence state when subscribed
          await channel.track({
            user_id: userId,
            username: randomName,
            color: userColor,
            online_at: new Date().getTime(),
          });
          setIsConnected(true);
          
          // Broadcast initial form state
          channel.send({
            type: 'broadcast',
            event: FORM_BROADCAST,
            payload: {
              user_id: userId,
              formData: formValues
            }
          });
        }
      });

    return () => {
      // Clean up subscription
      channel.unsubscribe();
    };
  }, []);

  // Watch for form changes and broadcast them
  useEffect(() => {
    // Only broadcast changes that came from the local user and if values actually changed
    if (isConnected && !localFormUpdateRef.current && channelRef.current) {
      // Check if any values have changed
      let hasChanges = false;
      
      for (const key in formValues) {
        if (formValues[key] !== previousFormValues.current[key]) {
          hasChanges = true;
          break;
        }
      }
      
      if (hasChanges) {
        // Update previous values to prevent redundant broadcasts
        previousFormValues.current = { ...formValues };
        
        channelRef.current.send({
          type: 'broadcast',
          event: FORM_BROADCAST,
          payload: {
            user_id: userId,
            formData: formValues
          }
        });
      }
    }
  }, [formValues, isConnected]);

  const handleFieldFocus = (fieldName, isFocused) => {
    if (isConnected && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: FOCUS_BROADCAST,
        payload: {
          user_id: userId,
          username,
          color: userColor,
          field: fieldName,
          isFocused
        }
      });
    }
  };

  // Check if a field is locked (being edited by another user)
  const isFieldLocked = (fieldName) => {
    return focusedFields[fieldName] && focusedFields[fieldName].user_id !== userId;
  };

  const renderUserBadge = (fieldName) => {
    if (!focusedFields[fieldName]) return null;
    
    const user = focusedFields[fieldName];
    return (
      <div 
        className="absolute right-0 top-1 transform -translate-y-1/2 px-2 py-1 rounded-full text-xs text-white"
        style={{ backgroundColor: user.color }}
      >
        {user.username}
      </div>
    );
  };
  
  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    if (isConnected && channelRef.current) {
      // Broadcast form submission to all clients
      channelRef.current.send({
        type: 'broadcast',
        event: SUBMIT_BROADCAST,
        payload: {
          user_id: userId,
          username,
          formData: formValues,
          submittedAt: new Date().toISOString()
        }
      });
      
      // Update local state
      setFormSubmitted(true);
      setSubmittedBy(username);
      setSubmittedData(formValues);
    }
  };

  if (formSubmitted) {
    return (
      <div className="p-8 flex flex-col min-h-screen bg-neutral-900 text-neutral-100 antialiased">
        <header className="mb-8">
          <div className="max-w-3xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-medium">Collaborative Form</h1>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full bg-green-400"
                title={isConnected ? 'Connected' : 'Disconnected'}
              ></div>
              <span className="text-sm text-neutral-400">
                {userCount} {userCount === 1 ? 'user' : 'users'} online
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto bg-neutral-800 rounded-lg p-6 border-neutral-600">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-md font-medium text-white mb-1">Form Submitted Successfully!</h2>
                <p className="text-neutral-400 text-sm">Submitted by {submittedBy}</p>
              </div>
            </div>
            
            <div className="space-y-3 my-6 text-sm">
              {submittedData && Object.entries(submittedData).map(([key, value]) => (
                <div key={key}>
                  <div className="text-sm text-neutral-400 capitalize mb-1">{key}</div>
                  <div className="text-white">{value || <em className="text-neutral-500">Empty</em>}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 flex flex-col bg-neutral-900 text-white antialiased">
      <header className="mb-8">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-medium">Collaborative Form</h1>
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full bg-green-400"
              title={isConnected ? 'Connected' : 'Disconnected'}
            ></div>
            <span className="text-sm text-neutral-400">
              {userCount} {userCount === 1 ? 'user' : 'users'} editing
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <form className="max-w-3xl mx-auto space-y-4">
          <div className="relative">
            {renderUserBadge('title')}
            <label className="block text-sm font-medium text-neutral-400 mb-2">
              Title
            </label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  className={\`w-full p-2 rounded-md bg-neutral-800 border text-sm \${
                    isFieldLocked('title') 
                      ? 'border-red-500 opacity-70' 
                      : field.value 
                        ? 'border-neutral-600' 
                        : 'border-neutral-700'
                  }\`}
                  disabled={isFieldLocked('title')}
                  style={{
                    borderColor: isFieldLocked('title') ? focusedFields['title'].color : '',
                    boxShadow: isFieldLocked('title') ? \`0 0 0 1px \${focusedFields['title'].color}\` : ''
                  }}
                  placeholder="Enter title"
                  onFocus={() => handleFieldFocus('title', true)}
                  onBlur={() => handleFieldFocus('title', false)}
                />
              )}
            />
          </div>

          <div className="relative">
            {renderUserBadge('subtitle')}
            <label className="block text-sm font-medium text-neutral-400 mb-2">
              Subtitle
            </label>
            <Controller
              name="subtitle"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  className={\`w-full p-2 rounded-md bg-neutral-800 border text-sm \${
                    isFieldLocked('subtitle') 
                      ? 'border-red-500 opacity-70' 
                      : field.value 
                        ? 'border-neutral-600' 
                        : 'border-neutral-700'
                  }\`}
                  disabled={isFieldLocked('subtitle')}
                  style={{
                    borderColor: isFieldLocked('subtitle') ? focusedFields['subtitle'].color : '',
                    boxShadow: isFieldLocked('subtitle') ? \`0 0 0 1px \${focusedFields['subtitle'].color}\` : ''
                  }}
                  placeholder="Enter subtitle"
                  onFocus={() => handleFieldFocus('subtitle', true)}
                  onBlur={() => handleFieldFocus('subtitle', false)}
                />
              )}
            />
          </div>

          <div className="relative">
            {renderUserBadge('url')}
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-neutral-400">
                URL
              </label>
            </div>
            <Controller
              name="url"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  className={\`w-full p-2 rounded-md bg-neutral-800 border text-sm \${
                    isFieldLocked('url') 
                      ? 'border-red-500 opacity-70' 
                      : field.value 
                        ? 'border-neutral-600' 
                        : 'border-neutral-700'
                  }\`}
                  disabled={isFieldLocked('url')}
                  style={{
                    borderColor: isFieldLocked('url') ? focusedFields['url'].color : '',
                    boxShadow: isFieldLocked('url') ? \`0 0 0 1px \${focusedFields['url'].color}\` : ''
                  }}
                  placeholder="Enter URL"
                  onFocus={() => handleFieldFocus('url', true)}
                  onBlur={() => handleFieldFocus('url', false)}
                />
              )}
            />
          </div>

          <div className="relative">
            {renderUserBadge('description')}
            <label className="block text-sm font-medium text-neutral-400 mb-2">
              Description
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={4}
                  className={\`w-full p-2 rounded-md bg-neutral-800 border text-sm \${
                    isFieldLocked('description') 
                      ? 'border-red-500 opacity-70' 
                      : field.value 
                        ? 'border-neutral-600' 
                        : 'border-neutral-700'
                  }\`}
                  disabled={isFieldLocked('description')}
                  style={{
                    borderColor: isFieldLocked('description') ? focusedFields['description'].color : '',
                    boxShadow: isFieldLocked('description') ? \`0 0 0 1px \${focusedFields['description'].color}\` : ''
                  }}
                  placeholder="Enter description"
                  onFocus={() => handleFieldFocus('description', true)}
                  onBlur={() => handleFieldFocus('description', false)}
                />
              )}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
              onClick={handleFormSubmit}
            >
              Submit Form
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}`

const formPresenceFiles = {
  '/App.js': appJsCode,
  '/styles.css': `/* No custom CSS needed - using Tailwind */`,
}

const layoutProps: ExampleLayoutProps = {
  appJsCode,
  files: formPresenceFiles,
  title: 'Form Presence',
  dependencies: {
    'react-hook-form': 'latest',
  },
  description:
    "A multi-user form that uses Supabase Realtime's presence feature to show which fields are currently being edited by other users in real-time.",
}

export default layoutProps
