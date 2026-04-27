import OpenAI from 'openai';
import type {
  ParserProvider,
  ParseInput,
  ParseResult,
  ParseMode,
  TranscribeInput,
  TranscribeResult,
} from './types';
import type { ParsedNoteJson } from '@/types/database';

const systemPrompts: Record<ParseMode, string> = {
  meeting_note: `You are an expert at extracting structured information from meeting notes.
Given the content of meeting notes (which may be handwritten, transcribed, or typed), extract:
- A clear, concise title for the meeting
- A 1-3 sentence summary of the key outcomes
- A cleaned-up version of the full text (fix spelling, grammar, formatting)
- Action items / tasks with due dates, priorities, and the person responsible (actionee) when mentioned
- People mentioned with their roles if apparent
- Projects or initiatives referenced
- Work domains or areas (e.g. Engineering, Marketing, Legal, Finance, Design, Operations)
- Decisions that were made, with rationale if available
- Open questions that remain unresolved
- Ideas or possibilities worth capturing (e.g. "we could try X", "what if we did Y", potential improvements or opportunities)

Be conservative: only extract information that is clearly present. Do not invent due dates, priorities, or decisions that aren't explicitly stated or strongly implied.`,

  plain_text_note: `You are an expert at extracting structured information from notes and written content.
Given plain text content (notes, emails, documents), extract:
- A clear, concise title
- A 1-3 sentence summary
- A cleaned-up version of the full text (fix spelling, grammar, formatting)
- Tasks or action items with due dates, priorities, and the person responsible (actionee) when mentioned
- People mentioned with their roles if apparent
- Projects or initiatives referenced
- Work domains or areas (e.g. Engineering, Marketing, Legal, Finance, Design, Operations)
- Decisions mentioned, with rationale if available
- Open questions or unresolved items
- Ideas or possibilities worth capturing (e.g. "we could try X", "what if we did Y", potential improvements or opportunities)

Be conservative: only extract information that is clearly present. Do not invent due dates, priorities, or decisions that aren't explicitly stated or strongly implied.`,

  email: `You are an expert at extracting structured information from emails.
Given the full text of an email (including From / To / Cc / Subject headers and body), extract:
- A clear, concise title — prefer the email's Subject line, lightly cleaned up if needed
- A 1-3 sentence summary of what the email is about and any outcomes
- A cleaned-up version of the email body (preserve meaningful structure; drop signatures, legal footers, and quoted reply chains unless directly relevant)
- Tasks or action items with due dates, priorities, and the person responsible (actionee) when mentioned
- People involved: include the sender (From) and recipients (To, Cc) as people, plus anyone named in the body. Use their role/title from the signature when available.
- Projects or initiatives referenced
- Work domains or areas (e.g. Engineering, Marketing, Legal, Finance, Design, Operations)
- Decisions mentioned, with rationale if available
- Open questions or unresolved items
- Ideas or possibilities worth capturing

Be conservative: only extract information that is clearly present. Do not invent due dates, priorities, or decisions that aren't explicitly stated or strongly implied.`,

  chat_transcript: `You are an expert at extracting structured information from chat transcripts and messaging threads.
Given a chat transcript (Google Chat, Slack, etc.), extract:
- A clear, concise title summarizing the conversation topic
- A 1-3 sentence summary of the key outcomes
- A cleaned-up narrative version of the conversation (not raw chat format)
- Action items / tasks assigned to people (include the person's name as actionee), with due dates and priorities when mentioned
- All people who participated or were mentioned, with their roles if apparent
- Projects or initiatives discussed
- Work domains or areas (e.g. Engineering, Marketing, Legal, Finance, Design, Operations)
- Decisions that were reached, with rationale if available
- Open questions that remain unresolved
- Ideas or possibilities worth capturing (e.g. "we could try X", "what if we did Y", potential improvements or opportunities)

Be conservative: only extract information that is clearly present. Do not invent due dates, priorities, or decisions that aren't explicitly stated or strongly implied.`,
};

const jsonSchema = {
  name: 'parsed_note',
  strict: true,
  schema: {
    type: 'object' as const,
    properties: {
      title: { type: 'string' as const, description: 'Clear, concise title' },
      summary: { type: 'string' as const, description: '1-3 sentence summary' },
      cleaned_text: { type: 'string' as const, description: 'Cleaned-up full text' },
      tasks: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            title: { type: 'string' as const },
            due_date: {
              type: ['string', 'null'] as unknown as 'string',
              description: 'YYYY-MM-DD format or null',
            },
            priority: {
              type: ['string', 'null'] as unknown as 'string',
              enum: ['P0', 'P1', 'P2', 'P3', null],
              description: 'P0 (critical), P1 (high), P2 (medium), P3 (low), or null',
            },
            actionee_name: {
              type: ['string', 'null'] as unknown as 'string',
              description: 'Name of the person responsible for this task, or null if not mentioned',
            },
          },
          required: ['title', 'due_date', 'priority', 'actionee_name'],
          additionalProperties: false,
        },
      },
      people: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            name: { type: 'string' as const },
            role: {
              type: ['string', 'null'] as unknown as 'string',
              description: 'Role or null if unknown',
            },
          },
          required: ['name', 'role'],
          additionalProperties: false,
        },
      },
      projects: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            name: { type: 'string' as const },
          },
          required: ['name'],
          additionalProperties: false,
        },
      },
      domains: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            name: {
              type: 'string' as const,
              description: 'Work area or category (e.g. Engineering, Marketing, Legal)',
            },
            description: {
              type: ['string', 'null'] as unknown as 'string',
              description: 'Brief description of the domain, or null',
            },
          },
          required: ['name', 'description'],
          additionalProperties: false,
        },
      },
      decisions: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            decision_text: { type: 'string' as const },
            rationale: {
              type: ['string', 'null'] as unknown as 'string',
            },
            decision_date: {
              type: ['string', 'null'] as unknown as 'string',
              description: 'YYYY-MM-DD format or null',
            },
          },
          required: ['decision_text', 'rationale', 'decision_date'],
          additionalProperties: false,
        },
      },
      open_questions: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            question_text: { type: 'string' as const },
          },
          required: ['question_text'],
          additionalProperties: false,
        },
      },
      ideas: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            idea_text: {
              type: 'string' as const,
              description: 'A possibility, opportunity, or speculative suggestion worth capturing',
            },
          },
          required: ['idea_text'],
          additionalProperties: false,
        },
      },
    },
    required: [
      'title',
      'summary',
      'cleaned_text',
      'tasks',
      'people',
      'projects',
      'domains',
      'decisions',
      'open_questions',
      'ideas',
    ],
    additionalProperties: false,
  },
};

export class OpenAIParserProvider implements ParserProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async parse(input: ParseInput): Promise<ParseResult> {
    const systemPrompt = systemPrompts[input.mode];

    // Build user message content
    const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];

    if (input.imageBase64 && input.imageMimeType) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: `data:${input.imageMimeType};base64,${input.imageBase64}`,
          detail: 'high',
        },
      });
      if (input.text) {
        userContent.push({
          type: 'text',
          text: `Additional context or OCR text:\n${input.text}`,
        });
      } else {
        userContent.push({
          type: 'text',
          text: 'Extract structured information from this image of handwritten or typed notes.',
        });
      }
    } else if (input.text) {
      userContent.push({
        type: 'text',
        text: input.text,
      });
    } else {
      return { error: 'No input provided (neither text nor image)' };
    }

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: jsonSchema,
        },
        temperature: 0.2,
        max_tokens: 4096,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return { error: 'Empty response from OpenAI' };
      }

      const parsed = JSON.parse(content) as ParsedNoteJson;
      return { data: parsed };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown parsing error';
      return { error: message };
    }
  }

  async transcribeAudio(input: TranscribeInput): Promise<TranscribeResult> {
    try {
      const file =
        input.audio instanceof File
          ? input.audio
          : new File([input.audio], input.filename, { type: input.audio.type });

      const response = await this.client.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        response_format: 'text',
      });

      const text = typeof response === 'string' ? response : (response as { text?: string }).text;
      if (!text) {
        return { error: 'Empty transcription response' };
      }
      return { text: text.trim() };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown transcription error';
      return { error: message };
    }
  }
}
