/** Capability id → sales Feature/Benefit line (from OE Flex scaffold spec). */
export const salesLines: Record<string, string> = {
  spine:
    'One environment takes you from spotting the attack to war-gaming the response to committing resources — no handoff, no gap.',
  export:
    'Brief the threat in the time it takes to click — no designer, no redraw, no stale screenshot.',
  milSymbology:
    'Your operators see the threat in the same symbols they already brief in — no translation, no second tool.',
  commercialSymbology:
    'Every audience gets the symbols they already use — no retraining, no confusion.',
  opsec:
    'Compartmentalized access means your partners see the threat, never your people — we built trust into the architecture, not the contract.',
  land:
    'Same shop that builds the Red vehicle already teaches you how the land fight looks, sounds, and radiates — one story from hardware to globe.',
  observe: 'See the fight as it forms — layers, filters, and symbology tuned to the audience in the room.',
  mitigate: 'Play the attack and the fix on one timeline — so the brief and the plan stay the same story.',
  wargame: 'Pick a mitigation, pressure it with a red model, and walk out with outcomes — not opinions.',
  decide: 'Commit ISR, security, subcontract, or VISMOD partners without leaving the map.',
  killSwitch: 'One control blanks live Observe layers — OPSEC when the room changes.',
  domains: 'Land live today; air, sea, EMS, info, cyber, undersea, and space plug into the same pipeline interface.',
  strikeHistory:
    'See the fight unfold — every strike, every origin, every hot zone, layered on the same map.',
  munitionInference:
    'Select a strike and brief the likely munitions — range, trajectory, and threat context, with confidence, on SAMPLE data.',
  orbat:
    'Inspect a unit pin and brief the order of battle — designation, vehicles, and the linked SAMPLE munition with its range — from one catalog.',
  engagementSphere:
    'Open a vehicle or linked munition and brief it in place — orbit the mesh, switch SAMPLE analysis layers, and keep the camouflage for that area of operations.',
  socialIw:
    'Read the information environment with the fight — Admiralty grades, claim status, and map hints on the same Observe picture.',
};

export type SalesCapabilityId = keyof typeof salesLines;
