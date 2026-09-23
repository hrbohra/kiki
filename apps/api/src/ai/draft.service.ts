import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { bakedDraft, buildDraftFacts, createWorld, DRAFT_TASKS, VIEWER_ID, type AiResult, type DraftAs, type DraftKind } from '@kiki/domain';
import { PrismaService } from '../prisma/prisma.service';
import { WorldService } from '../world/world.service';
import { actingMemberId } from '../common/actor';
import { AiRunner } from './ai-runner.service';

export interface DraftInput {
  kind: DraftKind;
  memberId: string; // who the message is for
  as: DraftAs; // who is writing: the host deciding, or the guest reaching out
  nights?: number; // the stay being discussed, when there is one
}

/**
 * Message drafts for the cold-state card ("You don't have to decide on this today"). Kiki writes
 * a first draft from what the graph can prove about these two people; the member reads it, edits
 * it and sends it themselves. This service returns TEXT and nothing else: it cannot send, accept,
 * decline or change a request. The model proposes; a person acts.
 */
@Injectable()
export class DraftService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly world: WorldService,
    private readonly runner: AiRunner,
  ) {}

  async draft(userId: string, input: DraftInput): Promise<AiResult> {
    const me = await actingMemberId(this.prisma, userId);
    if (me === input.memberId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot draft a message to yourself.' });
    // the writer's own vantage point: their routes, their overlaps, their unknowns
    const world = createWorld({ ...(await this.world.data()), viewerId: me });
    let story;
    try {
      story = world.trustStoryFor(input.memberId);
    } catch {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Unknown member.' });
    }
    const facts = buildDraftFacts(story, input.kind, input.as, input.nights);
    // The demo member's cold cards have prepared drafts, written from these same facts and held to
    // the same guard; they are the rung between a saved run and the plain template.
    const baked = me === VIEWER_ID ? bakedDraft(input.memberId, input.kind, input.as, input.nights) : undefined;
    return this.runner.run(DRAFT_TASKS[input.kind], facts, { caller: `draft:${userId}`, baked });
  }
}
