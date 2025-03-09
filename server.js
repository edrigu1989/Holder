const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Conectar a Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Servir archivos estáticos
app.use(express.static('.'));

// Middleware para verificar API Key
const verifyApiKey = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  
  // En producción, verificaríamos la API Key contra la base de datos
  const validApiKey = process.env.API_KEY || 'xxxx-xxxx-xxxx-xxxx';
  
  if (apiKey !== validApiKey) {
    return res.status(401).json({ error: 'API Key inválida' });
  }
  
  next();
};

// Recibir mensajes generales (webhook original)
app.post('/webhook', async (req, res) => {
  try {
    const { recordid, message } = req.body;
    await supabase.from('messages').insert([{ 
      recordid, 
      message, 
      processed: false,
      timestamp: new Date().toISOString(),
      sender: 'user'
    }]);
    res.status(200).send('Mensaje recibido');
  } catch (error) {
    console.error('Error al recibir mensaje:', error);
    res.status(500).send('Error al procesar el mensaje');
  }
});

// Webhook específico para ManyChat
app.post('/webhook/manychat/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // En producción, verificaríamos el token contra la base de datos
    const validToken = process.env.MANYCHAT_TOKEN || 'abc123def456';
    
    if (token !== validToken) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    const { recordid, message, name, metadata } = req.body;
    
    if (!recordid || !message) {
      return res.status(400).json({ error: 'Faltan campos requeridos (recordid, message)' });
    }
    
    // Guardar mensaje en la base de datos
    await supabase.from('messages').insert([{
      recordid,
      message,
      sender_name: name || 'Usuario',
      metadata: metadata || {},
      processed: false,
      timestamp: new Date().toISOString(),
      source: 'manychat',
      sender: 'user'
    }]);
    
    // Responder con éxito
    res.status(200).json({
      success: true,
      message: 'Mensaje recibido correctamente',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error en webhook de ManyChat:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// Webhook específico para n8n
app.post('/webhook/n8n/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // En producción, verificaríamos el token contra la base de datos
    const validToken = process.env.N8N_TOKEN || 'xyz789abc012';
    
    if (token !== validToken) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    const data = req.body;
    
    // Procesar la solicitud de n8n según tus necesidades
    console.log('Datos recibidos de n8n:', data);
    
    // Si n8n está enviando una respuesta para un mensaje anterior
    if (data.recordid && data.response) {
      await supabase.from('messages').insert([{
        recordid: data.recordid,
        message: data.response,
        processed: true,
        timestamp: new Date().toISOString(),
        source: 'n8n',
        sender: 'system'
      }]);
      
      // También podríamos actualizar los mensajes originales como procesados
      if (data.messageIds && Array.isArray(data.messageIds)) {
        await supabase
          .from('messages')
          .update({ processed: true })
          .in('id', data.messageIds);
      }
    }
    
    // Responder a n8n
    res.status(200).json({
      success: true,
      message: 'Procesado correctamente por M5V',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error en webhook de n8n:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// API para obtener configuración de webhooks (requiere autenticación)
app.get('/api/webhook-config', verifyApiKey, async (req, res) => {
  try {
    // En producción, esto vendría de la base de datos
    const config = {
      manychat: {
        token: process.env.MANYCHAT_TOKEN || 'abc123def456',
        url: `${req.protocol}://${req.hostname}/webhook/manychat/${process.env.MANYCHAT_TOKEN || 'abc123def456'}`
      },
      n8n: {
        token: process.env.N8N_TOKEN || 'xyz789abc012',
        url: `${req.protocol}://${req.hostname}/webhook/n8n/${process.env.N8N_TOKEN || 'xyz789abc012'}`
      }
    };
    
    res.json(config);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// API para actualizar tokens de webhook (requiere autenticación)
app.post('/api/update-webhook-token', verifyApiKey, async (req, res) => {
  try {
    const { type, token } = req.body;
    
    if (!type || !token) {
      return res.status(400).json({ error: 'Faltan campos requeridos (type, token)' });
    }
    
    if (type !== 'manychat' && type !== 'n8n') {
      return res.status(400).json({ error: 'Tipo de webhook inválido' });
    }
    
    // En producción, actualizaríamos el token en la base de datos
    if (type === 'manychat') {
      process.env.MANYCHAT_TOKEN = token;
    } else {
      process.env.N8N_TOKEN = token;
    }
    
    res.json({ 
      success: true, 
      message: `Token de ${type} actualizado correctamente`,
      url: `${req.protocol}://${req.hostname}/webhook/${type}/${token}`
    });
  } catch (error) {
    console.error('Error al actualizar token:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// API para actualizar API Key (requiere autenticación con la API Key anterior)
app.post('/api/update-api-key', verifyApiKey, async (req, res) => {
  try {
    const { newApiKey } = req.body;
    
    if (!newApiKey) {
      return res.status(400).json({ error: 'Falta el campo newApiKey' });
    }
    
    // En producción, actualizaríamos la API Key en la base de datos
    process.env.API_KEY = newApiKey;
    
    res.json({ 
      success: true, 
      message: 'API Key actualizada correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar API Key:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// API para obtener conversaciones
app.get('/api/conversations', verifyApiKey, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('recordid')
      .distinct();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API para obtener mensajes de una conversación
app.get('/api/messages/:recordid', verifyApiKey, async (req, res) => {
  try {
    const { recordid } = req.params;
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('recordid', recordid)
      .order('timestamp', { ascending: true });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API para enviar respuesta
app.post('/api/respond', verifyApiKey, async (req, res) => {
  try {
    const { recordid, message } = req.body;
    
    // Guardar respuesta en Supabase
    await supabase.from('messages').insert([{ 
      recordid, 
      message, 
      processed: true,
      timestamp: new Date().toISOString(),
      sender: 'agent'
    }]);
    
    // Aquí se enviaría la respuesta a ManyChat o n8n
    await sendResponse(recordid, message);
    
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API para actualizar la configuración de n8n
app.post('/api/update-n8n-config', verifyApiKey, async (req, res) => {
  try {
    const { projectName, workflowId, apiUrl, apiKey } = req.body;
    
    if (!projectName || !apiUrl) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    
    // En producción, guardaríamos esta configuración en la base de datos
    process.env.N8N_PROJECT_NAME = projectName;
    process.env.N8N_WORKFLOW_ID = workflowId;
    process.env.N8N_API_URL = apiUrl;
    process.env.N8N_API_KEY = apiKey;
    
    res.json({ 
      success: true, 
      message: 'Configuración de n8n actualizada correctamente' 
    });
  } catch (error) {
    console.error('Error al actualizar configuración de n8n:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// API para actualizar la configuración de Supabase
app.post('/api/update-supabase-config', verifyApiKey, async (req, res) => {
  try {
    const { url, key, table } = req.body;
    
    if (!url || !key) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    
    // En producción, guardaríamos esta configuración en la base de datos
    process.env.SUPABASE_URL = url;
    process.env.SUPABASE_KEY = key;
    process.env.SUPABASE_TABLE = table || 'messages';
    
    // Intentar reconectar a Supabase con las nuevas credenciales
    try {
      const newSupabase = createClient(url, key);
      
      // Probar la conexión haciendo una consulta sencilla
      const { data, error } = await newSupabase
        .from(process.env.SUPABASE_TABLE)
        .select('count(*)', { count: 'exact' })
        .limit(1);
      
      if (error) throw error;
      
      // Si llegamos aquí, la conexión fue exitosa
      // Actualizar la conexión global
      supabase = newSupabase;
      
      res.json({ 
        success: true, 
        message: 'Configuración de Supabase actualizada correctamente',
        connection: 'success'
      });
    } catch (testError) {
      console.error('Error al probar conexión:', testError);
      res.json({ 
        success: true, 
        message: 'Configuración guardada pero no se pudo conectar. Verifique las credenciales.',
        connection: 'error',
        error: testError.message
      });
    }
  } catch (error) {
    console.error('Error al actualizar configuración de Supabase:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// API para probar la conexión con Supabase
app.post('/api/test-supabase-connection', verifyApiKey, async (req, res) => {
  try {
    const { url, key, table } = req.body;
    
    if (!url || !key) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    
    try {
      const testSupabase = createClient(url, key);
      
      // Probar la conexión haciendo una consulta sencilla
      const { data, error } = await testSupabase
        .from(table || 'messages')
        .select('count(*)', { count: 'exact' })
        .limit(1);
      
      if (error) throw error;
      
      res.json({ 
        success: true, 
        message: 'Conexión exitosa',
        data
      });
    } catch (testError) {
      console.error('Error al probar conexión:', testError);
      res.status(400).json({ 
        success: false, 
        message: 'Error al conectar con Supabase',
        error: testError.message
      });
    }
  } catch (error) {
    console.error('Error al probar conexión:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// API para obtener la configuración actual
app.get('/api/config', verifyApiKey, async (req, res) => {
  try {
    const config = {
      n8n: {
        projectName: process.env.N8N_PROJECT_NAME || '',
        workflowId: process.env.N8N_WORKFLOW_ID || '',
        apiUrl: process.env.N8N_API_URL || '',
        // No enviar la API key por seguridad
        hasApiKey: !!process.env.N8N_API_KEY
      },
      supabase: {
        url: process.env.SUPABASE_URL || '',
        // No enviar la key por seguridad
        hasKey: !!process.env.SUPABASE_KEY,
        table: process.env.SUPABASE_TABLE || 'messages'
      },
      webhooks: {
        manychat: {
          token: process.env.MANYCHAT_TOKEN || 'abc123def456',
          url: `${req.protocol}://${req.hostname}/webhook/manychat/${process.env.MANYCHAT_TOKEN || 'abc123def456'}`
        },
        n8n: {
          token: process.env.N8N_TOKEN || 'xyz789abc012',
          url: `${req.protocol}://${req.hostname}/webhook/n8n/${process.env.N8N_TOKEN || 'xyz789abc012'}`
        }
      }
    };
    
    res.json(config);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Procesar mensajes cada 5 segundos
setInterval(async () => {
  const now = new Date();
  const threshold = 5000; // 5 segundos

  try {
    // Buscar usuarios con mensajes no procesados
    const { data: users } = await supabase
      .from('messages')
      .select('recordid')
      .eq('processed', false)
      .distinct();

    if (!users || users.length === 0) return;

    for (const user of users) {
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('recordid', user.recordid)
        .eq('processed', false)
        .order('timestamp', { ascending: true });

      if (!messages || messages.length === 0) continue;

      const lastMessageTime = new Date(messages[messages.length - 1].timestamp);
      if (now - lastMessageTime > threshold) {
        const response = await processMessages(messages); // Lógica personalizada
        await sendResponse(user.recordid, response);      // Enviar respuesta
        await supabase
          .from('messages')
          .update({ processed: true })
          .eq('recordid', user.recordid)
          .in('id', messages.map(m => m.id));
      }
    }
  } catch (error) {
    console.error('Error al procesar mensajes:', error);
  }
}, 5000);

async function processMessages(messages) {
  // En una implementación real, aquí procesarías los mensajes con una IA o reglas
  console.log(`Procesando ${messages.length} mensajes para ${messages[0].recordid}`);
  
  // Comprobar si tenemos configuración de n8n
  if (process.env.N8N_API_URL && process.env.N8N_API_KEY) {
    try {
      console.log('Procesando mensajes con n8n');
      
      // En producción, realizaríamos una petición HTTP a n8n
      // Ejemplo:
      /*
      const response = await axios.post(`${process.env.N8N_API_URL}/webhook/${process.env.N8N_WORKFLOW_ID}`, {
        projectName: process.env.N8N_PROJECT_NAME,
        messages: messages,
        recordid: messages[0].recordid
      }, {
        headers: {
          'X-N8N-API-KEY': process.env.N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data.response || "Mensaje procesado por n8n";
      */
      
      // Simulación de respuesta de n8n
      return `Mensaje procesado por n8n (Proyecto: ${process.env.N8N_PROJECT_NAME || 'Default'})`;
    } catch (error) {
      console.error('Error al procesar con n8n:', error);
      return "Error al procesar con n8n. Un agente te responderá pronto.";
    }
  }
  
  // Si no hay configuración de n8n, usar respuesta predeterminada
  return "Gracias por tu mensaje. Un agente te responderá pronto.";
}

async function sendResponse(recordid, response) {
  // Aquí envías la respuesta al sistema original (ej. ManyChat)
  try {
    console.log(`Respuesta a ${recordid}: ${response}`);
    
    // En una implementación real, aquí realizaríamos una petición HTTP a ManyChat o n8n
    // Ejemplo:
    /*
    // Si tenemos configuración para n8n, enviar a través de n8n
    if (process.env.N8N_API_URL && process.env.N8N_API_KEY) {
      await axios.post(`${process.env.N8N_API_URL}/webhook/${process.env.N8N_WORKFLOW_ID}`, {
        projectName: process.env.N8N_PROJECT_NAME,
        action: 'sendResponse',
        recordid,
        response
      }, {
        headers: {
          'X-N8N-API-KEY': process.env.N8N_API_KEY,
          'Content-Type': 'application/json'
        }
      });
    } else {
      // Si no, intentar enviar directamente a ManyChat
      await axios.post('https://api.manychat.com/fb/sending/sendContent', {
        subscriber_id: recordid,
        content: {
          messages: [
            {
              type: 'text',
              text: response
            }
          ]
        }
      }, {
        headers: {
          'Authorization': 'Bearer YOUR_MANYCHAT_API_KEY'
        }
      });
    }
    */
    
    // Guardar respuesta en Supabase para el registro
    const tableName = process.env.SUPABASE_TABLE || 'messages';
    await supabase.from(tableName).insert([{ 
      recordid, 
      message: response, 
      processed: true,
      timestamp: new Date().toISOString(),
      sender: 'system'
    }]);
    
    return true;
  } catch (error) {
    console.error('Error al enviar respuesta:', error);
    return false;
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`)); 