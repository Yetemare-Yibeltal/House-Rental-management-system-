// nestfind/nestfind/server/src/services/ai/leaseAiService.js

const aiService = require('./aiService');
const Contract = require('../../models/Contract');
const logger = require('../../utils/logger');

// ── MAIN LEASE EXPLAINER ──────────────────────────────────────────────────────

/**
 * Generate a plain-language explanation of a lease contract.
 *
 * @param {string} contractId - Contract document ID
 * @param {string} userId - User requesting explanation
 * @param {string} language - Language for explanation ('en' or 'am')
 * @returns {Object} - Plain language summary and key points
 */
const explainContract = async (contractId, userId, language = 'en') => {
  const startTime = Date.now();

  try {
    // Load contract from database
    const contract = await Contract.findOne({
      _id: contractId,
      $or: [{ tenant: userId }, { landlord: userId }],
    })
      .populate('property', 'title location pricing')
      .populate('tenant', 'firstName lastName')
      .populate('landlord', 'firstName lastName phone')
      .lean();

    if (!contract) {
      return {
        success: false,
        error: 'Contract not found or you do not have access to it',
      };
    }

    // Check if AI summary already exists and is recent (less than 7 days old)
    if (
      contract.ai?.plainLanguageSummary &&
      contract.ai?.summaryGeneratedAt &&
      Date.now() - new Date(contract.ai.summaryGeneratedAt).getTime() 
        7 * 24 * 60 * 60 * 1000
    ) {
      return {
        success: true,
        fromCache: true,
        summary: contract.ai.plainLanguageSummary,
        keyObligations: contract.ai.keyObligations,
        keyDates: contract.ai.keyDates,
        riskyClause: contract.ai.riskyClause,
        contractId,
      };
    }

    // Build contract details for AI
    const contractDetails = buildContractDetails(contract);

    const prompt = `You are a legal document explainer specializing in Ethiopian rental contracts. Explain this lease contract in simple, clear language that anyone can understand.

${contractDetails}

${language === 'am' ? 'Please explain in simple English but include key terms in Amharic where helpful.' : ''}

Return ONLY this JSON structure (no other text):
{
  "plainLanguageSummary": "<3-4 paragraph plain English summary of the entire contract>",
  "keyObligations": {
    "tenant": [
      "<tenant obligation 1>",
      "<tenant obligation 2>",
      "<tenant obligation 3>",
      "<tenant obligation 4>"
    ],
    "landlord": [
      "<landlord obligation 1>",
      "<landlord obligation 2>",
      "<landlord obligation 3>"
    ]
  },
  "keyDates": [
    {
      "date": "<ISO date string>",
      "description": "<what happens on this date>",
      "importance": "<low|medium|high>"
    }
  ],
  "financialSummary": {
    "monthlyRent": <number>,
    "securityDeposit": <number>,
    "paymentDueDay": <day of month>,
    "latePaymentFee": "<description of late fee>",
    "totalLeaseValue": <total rent over full lease period>
  },
  "riskyClause": [
    {
      "clause": "<the concerning clause in simple terms>",
      "risk": "<why this could be a problem>",
      "severity": "<low|medium|high>"
    }
  ],
  "importantPolicies": {
    "pets": "<pet policy in simple terms>",
    "smoking": "<smoking policy>",
    "guests": "<guest policy>",
    "maintenance": "<who handles what maintenance>",
    "earlyTermination": "<what happens if you leave early>"
  },
  "tenantRights": [
    "<right 1>",
    "<right 2>",
    "<right 3>"
  ],
  "redFlags": [
    "<red flag 1 if any, or empty array if none>"
  ],
  "overallAssessment": "<1-2 sentences: is this a fair contract for the tenant?>"
}

Guidelines:
- Use simple, everyday language — no legal jargon
- Be specific about amounts (ETB amounts, exact dates)
- If something is unusual or unfavorable to tenant, flag it clearly
- Ethiopian rental law context: tenants have rights to privacy, proper notice before entry
- Be helpful and informative, not alarmist`;

    const result = await aiService.sendMessage(
      prompt,
      'lease_explainer',
      { maxTokens: 2000 }
    );

    const responseTimeMs = Date.now() - startTime;

    if (!result.success || !result.content) {
      return {
        success: false,
        error: 'AI lease explainer is temporarily unavailable. Please try again.',
      };
    }

    const explanation = aiService.parseJSONResponse(result.content);

    if (!explanation) {
      return {
        success: false,
        error: 'Could not parse lease explanation. Please try again.',
      };
    }

    // Save AI summary to contract for future use
    await Contract.findByIdAndUpdate(contractId, {
      'ai.plainLanguageSummary': explanation.plainLanguageSummary,
      'ai.keyObligations': explanation.keyObligations,
      'ai.keyDates': explanation.keyDates,
      'ai.riskyClause': explanation.riskyClause,
      'ai.summaryLanguage': language,
      'ai.summaryGeneratedAt': new Date(),
    });

    // Log AI usage
    await aiService.logAIUsage({
      userId,
      feature: 'lease_explainer',
      action: 'ai_lease_explained',
      tokensUsed: result.tokensUsed,
      responseTimeMs,
      success: true,
    });

    logger.info(`Lease explained for contract ${contractId} in ${responseTimeMs}ms`);

    return {
      success: true,
      fromCache: false,
      summary: explanation.plainLanguageSummary,
      keyObligations: explanation.keyObligations,
      keyDates: explanation.keyDates,
      financialSummary: explanation.financialSummary,
      riskyClause: explanation.riskyClause,
      importantPolicies: explanation.importantPolicies,
      tenantRights: explanation.tenantRights,
      redFlags: explanation.redFlags || [],
      overallAssessment: explanation.overallAssessment,
      contractId,
      tokensUsed: result.tokensUsed,
      responseTimeMs,
    };
  } catch (error) {
    logger.error(`Lease explainer failed: ${error.message}`);
    return {
      success: false,
      error: 'Failed to explain lease. Please try again.',
    };
  }
};

// ── CONTRACT DETAILS BUILDER ──────────────────────────────────────────────────

/**
 * Format contract data for AI prompt.
 *
 * @param {Object} contract - Contract document
 * @returns {string} - Formatted contract details
 */
const buildContractDetails = (contract) => {
  const terms = contract.terms || {};
  const startDate = terms.startDate
    ? new Date(terms.startDate).toLocaleDateString('en-ET')
    : 'Not specified';
  const endDate = terms.endDate
    ? new Date(terms.endDate).toLocaleDateString('en-ET')
    : 'Not specified';

  return `
CONTRACT DETAILS:
=================
Contract Number: ${contract.contractNumber || 'N/A'}
Property: ${contract.property?.title || 'Not specified'}
Location: ${contract.property?.location?.address || ''}, ${contract.property?.location?.subCity || ''}, ${contract.property?.location?.city || 'Addis Ababa'}
Tenant: ${contract.tenant?.firstName} ${contract.tenant?.lastName}
Landlord: ${contract.landlord?.firstName} ${contract.landlord?.lastName} (${contract.landlord?.phone || 'Phone not listed'})
Status: ${contract.status}

FINANCIAL TERMS:
================
Monthly Rent: ETB ${terms.monthlyRent?.toLocaleString() || 'Not specified'}
Security Deposit: ETB ${terms.securityDeposit?.toLocaleString() || '0'}
Payment Due: Day ${terms.paymentDueDay || 1} of each month
Grace Period: ${terms.gracePeriodDays || 5} days
Late Payment Fee: ${terms.latePaymentFeeType === 'percentage' ? `${(terms.latePaymentFee || 0) * 100}%` : `ETB ${terms.latePaymentFee?.toLocaleString() || '0'}`} of monthly rent
Utilities: ${terms.utilityBillsIncluded ? 'Included in rent' : 'Tenant pays separately'}

LEASE PERIOD:
=============
Start Date: ${startDate}
End Date: ${endDate}
Duration: ${terms.minimumLeaseDuration || 6} ${terms.minimumLeaseDurationUnit || 'months'} minimum
Notice Period: ${terms.noticePeriodDays || 30} days notice required to end tenancy
Renewal Option: ${terms.renewalOption ? 'Yes, lease can be renewed' : 'No automatic renewal'}
Early Termination Fee: ETB ${terms.earlyTerminationFee?.toLocaleString() || '0'}

POLICIES:
=========
Pet Policy: ${terms.petPolicy || 'Not specified'}
Smoking Policy: ${terms.smokingPolicy || 'Not specified'}
Guest Policy: ${terms.guestPolicy || 'Not specified'}
Maintenance: ${terms.maintenanceResponsibility || 'Not specified'}

ADDITIONAL TERMS:
=================
${terms.additionalTerms || 'No additional terms specified'}

CONTRACT BODY:
==============
${contract.contractBody ? contract.contractBody.substring(0, 3000) : 'Full contract body not available — analysis based on structured terms above'}
`.trim();
};

// ── CLAUSE ANALYZER ───────────────────────────────────────────────────────────

/**
 * Analyze a specific clause from a contract.
 * Used when tenant wants to understand a particular section.
 *
 * @param {string} clauseText - The specific clause to analyze
 * @param {string} userId - User requesting analysis
 * @returns {Object} - Plain language explanation of the clause
 */
const analyzeClause = async (clauseText, userId) => {
  try {
    if (!clauseText || clauseText.trim().length < 10) {
      return {
        success: false,
        error: 'Please provide a clause to analyze',
      };
    }

    const prompt = `Explain this rental contract clause in simple, plain language for an Ethiopian tenant:

CLAUSE:
"${clauseText}"

Return ONLY this JSON (no other text):
{
  "plainExplanation": "<what this clause means in simple terms>",
  "impact": "<how this affects the tenant practically>",
  "isFavorableForTenant": <true|false>,
  "riskLevel": "<low|medium|high>",
  "whatToWatch": "<what the tenant should pay attention to>",
  "isNegotiable": <true|false>,
  "negotiationTip": "<how to negotiate this if unfavorable, or null>"
}`;

    const result = await aiService.sendMessage(
      prompt,
      'lease_explainer',
      { maxTokens: 600 }
    );

    if (!result.success) {
      return { success: false, error: 'Could not analyze clause' };
    }

    const analysis = aiService.parseJSONResponse(result.content);

    return {
      success: true,
      clause: clauseText,
      ...analysis,
      tokensUsed: result.tokensUsed,
    };
  } catch (error) {
    logger.error(`Clause analysis failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Compare two contract versions and highlight changes.
 * Used when lease is being renewed with modified terms.
 *
 * @param {string} originalContractId - Original contract ID
 * @param {Object} newTerms - New proposed terms
 * @param {string} userId - User requesting comparison
 * @returns {Object} - Changes and their impact
 */
const compareContractVersions = async (
  originalContractId,
  newTerms,
  userId
) => {
  try {
    const original = await Contract.findOne({
      _id: originalContractId,
      $or: [{ tenant: userId }, { landlord: userId }],
    }).lean();

    if (!original) {
      return { success: false, error: 'Original contract not found' };
    }

    const originalTerms = original.terms;

    const changes = [];

    // Compare key terms
    if (newTerms.monthlyRent !== originalTerms.monthlyRent) {
      const diff = newTerms.monthlyRent - originalTerms.monthlyRent;
      changes.push({
        field: 'Monthly Rent',
        original: `ETB ${originalTerms.monthlyRent?.toLocaleString()}`,
        new: `ETB ${newTerms.monthlyRent?.toLocaleString()}`,
        change: diff > 0 ? `Increase of ETB ${diff.toLocaleString()}` : `Decrease of ETB ${Math.abs(diff).toLocaleString()}`,
        isFavorableForTenant: diff <= 0,
        impact: diff > 0
          ? `Your monthly rent will increase by ETB ${diff.toLocaleString()}`
          : `Your monthly rent will decrease by ETB ${Math.abs(diff).toLocaleString()}`,
      });
    }

    if (newTerms.securityDeposit !== originalTerms.securityDeposit) {
      changes.push({
        field: 'Security Deposit',
        original: `ETB ${originalTerms.securityDeposit?.toLocaleString()}`,
        new: `ETB ${newTerms.securityDeposit?.toLocaleString()}`,
        isFavorableForTenant:
          newTerms.securityDeposit <= originalTerms.securityDeposit,
        impact: 'Security deposit amount has changed',
      });
    }

    if (newTerms.noticePeriodDays !== originalTerms.noticePeriodDays) {
      changes.push({
        field: 'Notice Period',
        original: `${originalTerms.noticePeriodDays} days`,
        new: `${newTerms.noticePeriodDays} days`,
        isFavorableForTenant:
          newTerms.noticePeriodDays <= originalTerms.noticePeriodDays,
        impact: 'The notice period required to end tenancy has changed',
      });
    }

    if (newTerms.petPolicy !== originalTerms.petPolicy) {
      changes.push({
        field: 'Pet Policy',
        original: originalTerms.petPolicy,
        new: newTerms.petPolicy,
        isFavorableForTenant: newTerms.petPolicy === 'allowed',
        impact: 'Pet policy has changed',
      });
    }

    return {
      success: true,
      changes,
      hasChanges: changes.length > 0,
      favorableChanges: changes.filter((c) => c.isFavorableForTenant).length,
      unfavorableChanges: changes.filter((c) => !c.isFavorableForTenant).length,
      recommendation:
        changes.filter((c) => !c.isFavorableForTenant).length > 2
          ? 'Multiple terms are less favorable than your original lease. Consider negotiating before signing.'
          : 'The changes appear reasonable. Review carefully before signing.',
    };
  } catch (error) {
    logger.error(`Contract comparison failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = {
  explainContract,
  analyzeClause,
  compareContractVersions,
  buildContractDetails,
};