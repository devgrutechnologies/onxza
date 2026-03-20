/**
 * @onxza/core — Main entry point
 * Re-exports all public API surfaces.
 *
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 * Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
 */

// Types
export * from './types.js';

// Schema
export {
  validateSchema,
  assertValidConfig,
  getSchema,
  type SchemaValidationError,
  type SchemaValidationResult,
} from './schema/index.js';

// Config
export {
  getOpenclawRoot,
  getConfigPath,
  getWorkspacePath,
  readConfig,
  requireConfig,
  validateConfig,
  writeConfig,
  seedConfig,
  registerAgent,
  removeAgent,
  getAgent,
  listAgents,
  registerCompany,
  getCompany,
  listCompanies,
  setActiveCompany,
  migrateConfig,
  getSchemaVersion,
  type MigrationResult,
} from './config/index.js';

// Template
export {
  renderTemplate,
  renderAgentTemplate,
  renderAllAgentTemplates,
} from './template/index.js';

// TORI-QMD
export {
  detectFileType,
  parseFrontmatter,
  hasCreditLine,
  validateFile,
  validateAgentWorkspace,
  allPass,
} from './tori/index.js';

// Checkpoint
export {
  getCheckpointsDir,
  createCheckpoint,
  listCheckpoints,
  getCheckpoint,
  type CreateCheckpointOptions,
} from './checkpoint/index.js';

// Agent
export {
  parseAgentName,
  resolveModel,
  inferDefaultModel,
  sharedLearningsReadPaths,
  sharedLearningsWritePath,
  createAgent,
  validateAgent,
  listAgentsSummary,
  type AgentNameValidation,
  type AgentValidationResult,
} from './agent/index.js';

// Company
export {
  deriveSlug,
  validateSlug,
  addCompany,
  listCompaniesSummary,
  switchCompany,
  type AddCompanyOptions,
  type AddCompanyResult,
  type CompanySummary,
} from './company/index.js';

// Ticket
export {
  getTicketsDir,
  getTicketStatusDir,
  parseTicketFrontmatter,
  extractTicketBody,
  readTicket,
  listTickets,
  findTicketById,
  generateTicketId,
  createTicket,
  moveTicket,
  countTickets,
  type TicketListOptions,
  type CreateTicketOptions,
  type MoveTicketResult,
  type TicketCounts,
} from './ticket/index.js';

// Dispatcher
export {
  runDispatchCycle,
  getDispatcherStatus,
  type DispatchOptions,
  type DispatcherStatus,
} from './dispatcher/index.js';

// MPI — Model Performance Index
export {
  logMpiEntry,
  queryMpi,
  aggregateMpi,
  exportMpi,
  type MpiEntry,
  type MpiQueryOptions,
  type MpiReport,
  type ModelStats,
  type MpiTaskType,
  type MpiFvpResult,
  type MpiOutcome,
  type LogMpiOptions,
} from './mpi/index.js';

// Shared Learnings
export {
  getSharedLearningsDir,
  getCompanyLearningsDir,
  listLearnings,
  promoteLearning,
  validateLearningFile,
  type ListLearningsOptions,
  type LearningValidationResult,
} from './learnings/index.js';
