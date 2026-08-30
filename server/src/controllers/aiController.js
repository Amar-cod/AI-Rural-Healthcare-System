const AISession = require('../models/AISession');
const User = require('../models/User');
const geminiService = require('../services/geminiService');

/**
 * Try to parse the AI response as the final JSON summary.
 * Returns the parsed object if valid, null otherwise.
 */
const tryParseSummary = (text) => {
  try {
    // The AI might wrap JSON in code fences, strip them
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned);

    // Validate it has the expected fields
    if (
      typeof parsed.summary === 'string' &&
      typeof parsed.suggestedPriority === 'string' &&
      ['high', 'medium', 'routine'].includes(parsed.suggestedPriority)
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

const chatWithAI = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const patientId = req.user.id;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    let session;

    if (sessionId) {
      session = await AISession.findById(sessionId);
      if (!session) return res.status(404).json({ message: 'Session not found.' });
      if (session.patientId.toString() !== patientId) {
        return res.status(403).json({ message: 'Not authorized.' });
      }
      if (session.status === 'handed-off') {
        return res.status(400).json({ message: 'This session has already been handed off to a doctor.' });
      }
    } else {
      // Create a new session
      session = new AISession({ patientId, messages: [] });
    }

    // Add user message
    session.messages.push({ role: 'user', text: message.trim() });

    // Build messages array for Gemini
    const messagesForGemini = session.messages.map(m => ({
      role: m.role,
      text: m.text
    }));

    // Call Gemini
    const aiResponse = await geminiService.chat(messagesForGemini);

    // Add AI response
    session.messages.push({ role: 'assistant', text: aiResponse });

    // Check if the response is the final JSON summary
    const summary = tryParseSummary(aiResponse);
    if (summary) {
      session.symptomsSummary = summary.summary;
      session.redFlags = summary.redFlags || [];
      session.suggestedPriority = summary.suggestedPriority;
    }

    await session.save();

    res.json({
      sessionId: session._id,
      reply: aiResponse,
      isComplete: !!summary,
      summary: summary || null
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ message: 'Failed to process your message. Please try again.' });
  }
};

const handoffSession = async (req, res) => {
  try {
    const { id } = req.params;
    const patientId = req.user.id;

    const session = await AISession.findById(id);
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    if (session.patientId.toString() !== patientId) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (session.status === 'handed-off') {
      return res.status(400).json({ message: 'Already handed off.' });
    }

    session.status = 'handed-off';
    await session.save();

    // Create a Consultation record from the AI session
    const Consultation = require('../models/Consultation');
    const consultation = await Consultation.create({
      patientId: session.patientId,
      aiSessionId: session._id,
      finalPriority: session.suggestedPriority,
      notes: session.symptomsSummary || ''
    });

    // Update patient's current priority if the session priority is higher
    const patient = await User.findById(session.patientId);
    if (patient) {
      const priorityWeights = { routine: 1, medium: 2, high: 3, critical: 4 };
      const currentWeight = priorityWeights[patient.currentPriority] || 1;
      const newWeight = priorityWeights[session.suggestedPriority] || 1;
      if (newWeight > currentWeight) {
        patient.currentPriority = session.suggestedPriority;
        await patient.save();
      }
    }

    res.json({ message: 'Session handed off to doctor successfully.', consultation });
  } catch (error) {
    console.error('Handoff error:', error);
    res.status(500).json({ message: 'Server error during handoff.' });
  }
};

module.exports = { chatWithAI, handoffSession };
