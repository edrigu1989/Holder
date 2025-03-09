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

// Recibir mensajes del webhook
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

// API para obtener conversaciones
app.get('/api/conversations', async (req, res) => {
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
app.get('/api/messages/:recordid', async (req, res) => {
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
app.post('/api/respond', async (req, res) => {
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
  // Aquí procesas los mensajes (ej. con una IA)
  // Por ahora retornamos una respuesta simple
  return "Gracias por tu mensaje. Un agente te responderá pronto.";
}

async function sendResponse(recordid, response) {
  // Aquí envías la respuesta al sistema original (ej. ManyChat)
  try {
    // Implementar la lógica para enviar a ManyChat o n8n
    console.log(`Respuesta a ${recordid}: ${response}`);
    
    // Guardar respuesta en Supabase
    await supabase.from('messages').insert([{ 
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