/**
 * Type definitions for server worker jobs.
 */

import { TCommit } from "../utility/GithubWebhookMiddleware";

/**
 * Represents each kind of task the worker can execute
 */
export enum JobKind {
  CheckLinks = "check_links", // visit the websites listed in Resources and check for broken URLs
  CheckNewAlerts = "check_new_alerts", // look for alerts whose start time has come and process them
  DestroyAllSessions = "destroy_all_sessions", // wipes all the user sessions from the mongodb collection
  JobrunnerProcessScript = "jobrunner_process_script_(step_1)", // a new script has been uploaded for the jobrunner to run. fetch and build it
  JobrunnerExecuteScript = "jobrunner_execute_script_(step_2)", // execute a script build in step 1
  JobrunnerCleanupScript = "jobrunner_cleanup_script_(step_3)", // remove source from repo and commit execution record
  Test = "test", // no-op job used for testing the worker/queue
  SyncAlgolia = "sync_algolia", // update algolia index with latest resources
}

// PROCESS (fetch/transpile) -> EXECUTE -> CLEANUP (remove source/write result)

export interface TJobJobrunnerProcessScriptData {
  kind: JobKind.JobrunnerProcessScript;
  filename: string;
  repository: string; // ex: codeforboulder/upswyng
  commit: TCommit;
  userId?: string; // _id of user who started this job (prob the bot)
}

export interface TJobJobrunnerProcessScriptResult {
  kind: JobKind.JobrunnerProcessScript;
  source: string; // the sourcecode of the script
  nodeScript: string; // the generated node script from the source
}

export interface TJobJobrunnerExecuteScriptData {
  kind: JobKind.JobrunnerExecuteScript;
  filename: string;
  repository: string; // ex: codeforboulder/upswyng
  commit: TCommit;
  userId?: string; // _id of user who started this job (prob the bot)
  processJobId: string; // id of the step 1 job
  nodeScript: string; // generated in step 1
}

export interface TJobJobrunnerExecuteScriptResult {
  kind: JobKind.JobrunnerExecuteScript;
  output: string; // the recorded stdout/stderr from script execution
  startTime: number;
  endTime: number;
  exitCode: number;
}

export interface TJobJobrunnerCleanupScriptData {
  commit: TCommit;
  endTime: number; // generated in step 2
  exitCode: number; // generated in step 2
  filename: string;
  kind: JobKind.JobrunnerCleanupScript;
  nodeScript: string; // generated in step 1
  output: string; // generated in step 2
  processJobId: string; // id of the step 1 job
  executeJobId: string; // id of the step 2 job
  repository: string; // ex: codeforboulder/upswyng
  startTime: number; // generated in step 2
  userId?: string; // _id of user who started this job (prob the bot)
}

export interface TJobJobrunnerCleanupScriptResult {
  kind: JobKind.JobrunnerCleanupScript;
  sourceDeleteCommitUrl: string; // github url of commit which removes source file
  resultCommitUrl: string; // github url of commit which adds result file
}

// DestroyAllSessions
// wipes all the user sessions from the mongodb collection
export interface TJobDestroyAllSessionsData {
  kind: JobKind.DestroyAllSessions;
  userId?: string; // _id of user who started this job
}

export interface TJobDestroyAllSessionsResult {
  kind: JobKind.DestroyAllSessions;
}

// Test Job
export interface TJobTestData {
  kind: JobKind.Test;
  userId?: string; // _id of user who started this job
  shouldFail?: boolean; // force this job to fail at some point
}

export interface TJobTestResult {
  kind: JobKind.Test;
}

/**
 * Check for alerts that have recently become active. Log an event/send a message
 * to Slack, and push the notification out to clients.
 */
export interface TJobCheckNewAlertsData {
  kind: JobKind.CheckNewAlerts;
  userId: string; // _id of user who initiated the job
}

export interface TJobCheckNewAlertsResult {
  kind: JobKind.CheckNewAlerts;
  alertsProcessed: string[];
  jobName: string;
}

/**
 * Check the links in the Resource directory for broken URLs
 */
export interface TJobCheckLinksData {
  kind: JobKind.CheckLinks;
  userId: string; // _id of user who initiated the job
}
export interface TJobCheckLinksResult {
  erroredLinks: {
    accessTime: Date;
    resourceId: string;
    status: number | null;
    statusText: string;
    url: string;
  }[];
  linksCheckedCount: number;
  jobName: string;
  kind: JobKind.CheckLinks;
}

/**
 *  Update algolia index with latest resources
 */
export interface TJobSyncAlgoliaData {
  kind: JobKind.SyncAlgolia;
  userId: string; // _id of user who started this job
}
export interface TJobSyncAlgoliaResult {
  kind: JobKind.SyncAlgolia;
  jobName: string;
  succeeded: boolean;
  deletedRecords: string[];
  insertedRecords: string[];
}

export type TJobData =
  | TJobCheckLinksData
  | TJobCheckNewAlertsData
  | TJobDestroyAllSessionsData
  | TJobJobrunnerProcessScriptData
  | TJobTestData
  | TJobJobrunnerCleanupScriptData
  | TJobJobrunnerExecuteScriptData
  | TJobSyncAlgoliaData;

export type TJobResult =
  | TJobCheckLinksResult
  | TJobCheckNewAlertsResult
  | TJobJobrunnerCleanupScriptResult
  | TJobDestroyAllSessionsResult
  | TJobTestResult
  | TJobJobrunnerExecuteScriptResult
  | TJobSyncAlgoliaResult
  | TJobJobrunnerProcessScriptResult;
