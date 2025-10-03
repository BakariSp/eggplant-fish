export type CommonCtx = {
  app_name: string;
  timestamp: string; // e.g. new Date().toISOString()
};

export type Owner = { name: string; email: string };
export type Finder = { name?: string; email?: string };
export type Pet = { name: string; last_seen_location?: string };

export function lostToOwner(pet: Pet, owner: Owner, ctx: CommonCtx) {
  return {
    subject: `【${pet.name}】 has been marked as “Lost”`,
    text:
`Hello ${owner.name},

Your pet "${pet.name}" has been marked as LOST.
If this action was not made by you, please check on your pet immediately and also review your account security.

We recommend that you:
1) Search your nearby area and ask neighbors;
2) Ensure your collar tag and contact information are correct;
3) Keep your notifications on and watch for any incoming reports.

— ${ctx.app_name} Team
(Time: ${ctx.timestamp}, Last seen location: ${pet.last_seen_location || 'Unknown'})`,
  };
}

export function foundToOwner(pet: Pet, owner: Owner, ctx: CommonCtx) {
  return {
    subject: `【${pet.name}】 has been marked as “Found”`,
    text:
`Hello ${owner.name},

Great news! Your pet "${pet.name}" has been marked as FOUND.

We suggest that you:
1) Close the “Lost” status in the system;
2) Confirm that your contact information is still up to date;
3) Thank anyone who helped you during the search.

— ${ctx.app_name} Team
(Time: ${ctx.timestamp})`,
  };
}

export function reportedFoundToFinder(pet: Pet, finder: Finder, ctx: CommonCtx) {
  return {
    subject: `You have reported finding 【${pet.name}】`,
    text:
`Hello ${finder.name || 'Friend'},

Thank you for your help! You have reported that you found the pet "${pet.name}". We have notified the owner.

Please keep your contact information available — the owner will reach out to you soon (please do not share sensitive information publicly).

Tips:
• If possible, provide water or temporary shelter in a safe way;
• If an in-person handover is needed, always choose a safe and public location.

— ${ctx.app_name} Team
(Time: ${ctx.timestamp})`,
  };
}

export function reportedFoundToOwner(
  pet: Pet,
  owner: Owner,
  finderMaskedContact: string,
  found_location: string | undefined,
  ctx: CommonCtx
) {
  return {
    subject: `Possible lead: Someone reported finding 【${pet.name}】`,
    text:
`Hello ${owner.name},

We received a lead: someone has reported possibly finding your pet "${pet.name}".
Please contact the reporter through the system and verify the details as soon as possible.

Summary of the lead:
• Reporter contact: ${finderMaskedContact}
• Found location: ${found_location || 'Not provided'}
• Time: ${ctx.timestamp}

Reminder: For your safety, use the in-app communication first, and take caution when arranging any in-person meetings.

— ${ctx.app_name} Team`,
  };
}


