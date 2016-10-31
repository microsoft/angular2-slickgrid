"use strict";
const ViewModel_1 = require('./ViewModel');
var Dependency;
(function (Dependency) {
    Dependency[Dependency["Python"] = 0] = "Python";
    Dependency[Dependency["Python_Conda"] = 1] = "Python_Conda";
    Dependency[Dependency["Python_Pandas"] = 2] = "Python_Pandas";
    Dependency[Dependency["Python_Dill"] = 3] = "Python_Dill";
    Dependency[Dependency["Python_Numexpr"] = 4] = "Python_Numexpr";
    Dependency[Dependency["Python_Regex"] = 5] = "Python_Regex";
    Dependency[Dependency["Python_PyODBC"] = 6] = "Python_PyODBC";
    Dependency[Dependency["Python_SciPy"] = 7] = "Python_SciPy";
    Dependency[Dependency["Python_CondaConfig"] = 8] = "Python_CondaConfig";
    Dependency[Dependency["Python_CondaClean"] = 9] = "Python_CondaClean";
})(Dependency || (Dependency = {}));
var Runtime;
(function (Runtime) {
    Runtime[Runtime["Python"] = 0] = "Python";
})(Runtime || (Runtime = {}));
var RunStatus;
(function (RunStatus) {
    RunStatus[RunStatus["Unknown"] = 0] = "Unknown";
    RunStatus[RunStatus["Created"] = 1] = "Created";
    RunStatus[RunStatus["Translated"] = 2] = "Translated";
    RunStatus[RunStatus["Submitted"] = 3] = "Submitted";
    RunStatus[RunStatus["WaitingForInput"] = 4] = "WaitingForInput";
    RunStatus[RunStatus["Running"] = 5] = "Running";
    RunStatus[RunStatus["Completed"] = 6] = "Completed";
    RunStatus[RunStatus["InError"] = 7] = "InError";
})(RunStatus || (RunStatus = {}));
class Localization {
    constructor() {
        this.strings = {
            addDataSource: 'Add Data Source',
            dataSourcePreviewFailed: 'Unable to load preview.',
            addBlock: 'Add Step',
            blockHistory: 'Steps',
            configure: 'Configure',
            editPropertiesSubmit: 'Commit Changes',
            projectExtension: 'dprep',
            projectExtensionName: 'Pendleton Packages',
            projectDefaultName: 'Package',
            projectsFolderName: 'Pendleton Packages',
            createProjectDialogTitle: 'Choose where to create your new Pendleton Package',
            saveProjectDialogTitle: 'Choose where to save your Pendleton Package',
            sendFeedback: 'Send Feedback',
            openProjectDialogTitle: 'Choose a Pendleton Package to open',
            appTitle: 'Microsoft Codename Project "Pendleton"',
            appTitleWithProject: ' - Microsoft Codename Project "Pendleton"',
            appTitleShort: 'Pendleton',
            contactUs: 'Contact Us',
            submit: 'Submit',
            renameActivity: 'Rename Dataflow',
            profiling: 'PROFILING',
            startPageRecent: 'Recent Packages',
            startPageWelcome: 'Welcome to Pendleton',
            startPageWhatsNew: 'What\'s New',
            startPageTutorial: 'Tutorial',
            deriveColumnByExample: 'New Derived Column',
            editColumns: 'Select Columns',
            loadingCell: 'Loading...',
            updateAvailable: 'An update is available. Please restart the app to apply it.',
            deleteActivityPromptTitle: 'Delete Dataflow',
            deleteActivityPromptMessage: 'Are you sure you wish to delete this Dataflow?',
            deleteBlockPromptTitle: 'Delete Step',
            deleteBlockPromptMessage: 'Are you sure you wish to delete this Step?',
            loadingData: 'Loading Data',
            statsSummaryHeader: 'SUMMARY',
            statsNumRows: '# Rows',
            statsMissingRows: '# Missing Rows',
            statsHeader: 'STATISTICS',
            statsMinimum: 'Minimum',
            statsLowerQuartile: 'Lower Quartile',
            statsMedian: 'Median',
            statsUpperQuartile: 'Upper Quartile',
            statsMaximum: 'Maximum',
            statsAverage: 'Average',
            statsStandardDeviation: 'Standard Deviation',
            histogram: 'Histogram',
            boxPlot: 'Box Plot',
            numericStats: 'Column Statistics',
            valueCount: 'Value Count',
            dataStats: 'Data Statistics',
            scatterPlot: 'Scatter Plot',
            missingInspectorData: 'Data Not Applicable',
            filePickerLabel: 'Choose File...',
            defaultOpenFileDialogTitle: 'Open file',
            allFiles: 'All Files',
            learnMore: 'Learn more...',
            activityDefaultName: 'New Dataflow'
        };
        this.blocks = {
            'CSVFile': 'Load from CSV Data Source',
            'JSONFile': 'Load from JSON Data Source',
            'RDBMS': 'Load from RDBMS',
            'TwoWayJoin': 'Join',
            'Microsoft.DPrep.AdjustColumnPrecisionBlock': 'Adjust Precision',
            'Microsoft.DPrep.RemoveRowOnColumnMissingValuesBlock': 'Remove Rows with Missing Values',
            'Microsoft.DPrep.ConvertColumnFieldTypeBlock': 'Convert Field Type to Numeric',
            'Microsoft.DPrep.SelectRowsOnDistinctValuesInColumnBlock': 'Distinct Rows',
            'Microsoft.DPrep.ColumnRenameBlock': 'Rename Column',
            'Microsoft.DPrep.WriteToCsvBlock': 'Write to CSV',
            'Microsoft.DPrep.SummarizeBlock': 'Summarize',
            'Microsoft.DPrep.FilterBlock': 'Filter',
            'Microsoft.DPrep.DeleteColumnBlock': 'Remove Column',
            'Microsoft.DPrep.SortBlock': 'Sort',
            'Microsoft.DPrep.ConvertColumnFieldTypeToDateBlock': 'Convert Field Type to Date',
            'Microsoft.DPrep.DeriveColumnByExample': 'Add Column by Example',
            'Microsoft.DPrep.AddCustomColumnBlock': 'Add Column',
            'Microsoft.DPrep.CustomBlock': 'Transform Frame',
            'Microsoft.DPrep.AutoSplitColumnBlock': 'Auto-split Column',
            'Microsoft.DPrep.ConvertColumnFieldTypeToStringBlock': 'Convert Field Type to String'
        };
        this.inspectors = {
            'Microsoft.DPrep.NumericColumnStatsInspector': 'Column Statistics',
            'Microsoft.DPrep.HistogramInspector': 'Histogram',
            'Microsoft.DPrep.ValueCountInspector': 'Value Counts',
            'Microsoft.DPrep.BoxAndWhiskerInspector': 'Box Plot',
            'Microsoft.DPrep.ScatterPlotInspector': 'Scatter Plot'
        };
        this.dataSources = {
            CSVFile: 'CSV File',
            JSONFile: 'JSON File',
            RDBMS: 'Database'
        };
        this.properties = {
            addGroup: 'Add to Existing Groups',
            columnId: 'Column Name',
            commentLineCharacter: 'Comment Line Character',
            customBlock: 'Code to Transform Frame',
            customExpression: 'New Column Expression',
            database: 'Database',
            databaseType: 'Database System',
            decimalPlaces: 'Decimal Places',
            decimalPoint: 'Decimal Symbol',
            defaultBucketing: 'Default Number of Buckets (Scott\'s Rule)',
            densityPlot: 'Kernel Density Plot Overlay (Gaussian Kernel)',
            descending: 'Descending',
            emailAddress: 'Contact Email Address (optional)',
            eol: 'Line Ending',
            examples: 'Examples used',
            fileEncoding: 'File Encoding',
            filePath: 'File Path',
            filterExpression: 'Filter Expression',
            groupByColumn: 'Group by Column',
            groupByColumns: 'Group by Columns',
            haloEffect: 'Display Halo',
            localPath: 'Local Path',
            login: 'Login',
            message: 'Message',
            na: 'Missing Value Replacement',
            newColumnId: 'New Column Name',
            newColumnsBaseName: 'Base name for new columns',
            numberOfBreaks: 'Minimum Number of Buckets (Applies even when default bucketing is checked)',
            sampleSize: 'Sample Size',
            numberOfTopValues: 'Number of Top Values',
            path: 'Path',
            password: 'Password',
            query: 'Query',
            quote: 'Values in Quotes?',
            remotePath: 'Remote Path',
            sampleType: 'Sample',
            sasUrl: 'Blob connection string with SAS token',
            separator: 'Separator',
            server: 'Server',
            subject: 'Subject',
            summaryFunction: 'Summary Function',
            summarizedColumnId: 'Summarized Column Name',
            trustCert: 'Trust server CA',
            useColumnHeaders: 'Use Column Headers?',
            userId: 'Login to Azure',
            skipRows: 'Lines to Skip'
        };
        this.dependencies = {
            [Dependency.Python]: 'Python',
            [Dependency.Python_Conda]: 'conda',
            [Dependency.Python_Pandas]: 'pandas',
            [Dependency.Python_Dill]: 'dill',
            [Dependency.Python_Numexpr]: 'numexpr',
            [Dependency.Python_Regex]: 'regex',
            [Dependency.Python_PyODBC]: 'pyOdbc',
            [Dependency.Python_SciPy]: 'SciPy',
            [Dependency.Python_CondaConfig]: 'conda config',
            [Dependency.Python_CondaClean]: 'conda clean'
        };
        this.dependenciesSetup = {
            installed: 'installed',
            required: 'required',
            error: {
                missingDependency: 'Following dependencies must be installed for Microsoft Codename Project "Pendleton" to run.'
            }
        };
        /* tslint:disable:max-line-length */
        this.clusterCredentialsDialog = {
            preface: 'Enter the details of an HDInsight Spark Cluster where the package will run. You can browse or create an HDInsight Spark Cluster in the Windows Azure Management portal.',
            url: 'Cluster URL',
            userName: 'Cluster Login Username',
            password: 'Cluster Login Password',
            storageAccount: 'Cluster Storage Account',
            storageAccessKey: 'Cluster Storage Access Key',
            storageContainer: 'Cluster Storage Container'
        };
        this.projectRunsColumns = {
            projectName: 'Package Name',
            clusterName: 'Cluster Name',
            submitTime: 'Submit Time',
            status: 'Status',
            startedTime: 'Started Time',
            completedTime: 'Completed Time',
            logsLink: 'Logs',
            livyLink: 'Livy details',
            errorRecordLink: 'Error Records'
        };
        this.projectRunsLabels = {
            livyApplication: 'Spark/Livy application'
        };
        this.projectRunStatus = {
            [RunStatus.Unknown]: 'Unknown',
            [RunStatus.Created]: 'Created',
            [RunStatus.Translated]: 'Translated',
            [RunStatus.Submitted]: 'Submitted',
            [RunStatus.WaitingForInput]: 'Waiting for Input',
            [RunStatus.Running]: 'Running',
            [RunStatus.Completed]: 'Completed',
            [RunStatus.InError]: 'InError'
        };
        this.projectExportsDialog = {
            [Runtime.Python]: {
                extensionDescription: 'Python Script',
                extension: 'py'
            }
        };
        this.commands = {
            AppQuit: 'Quit',
            CreateProject: 'New Package...',
            OpenProject: 'Open Package...',
            SaveProject: 'Save Package As...',
            FileOpen: 'Open Data Source...',
            ExportScript: 'Export Script...',
            RenameActivity: 'Rename Dataflow...',
            DeleteActivity: 'Delete Dataflow',
            CloseProject: 'Close Package',
            TRACE: 'Trace',
            DEBUG: 'Debug',
            ERROR: 'Error',
            ToggleDevTools: 'Toggle Dev Tools',
            RunProjectOnSparkCluster: 'Spark Cluster...',
            ViewProjectRuns: 'View Package Runs...'
        };
        this.menuItems = {
            File: 'File',
            Edit: 'Edit',
            DPrep: 'Pendleton',
            Activities: 'Dataflows',
            Transformations: 'Transforms',
            Inspectors: 'Inspectors',
            Options: 'Options',
            LogLevel: 'Set Log Level',
            RunProjectOn: 'Run Package On',
            Help: 'Help'
        };
        this.blockMenuItems = {
            Edit: 'Edit',
            Delete: 'Delete',
            MoveUp: 'Move Up'
        };
        this.confirmDialog = {
            Ok: 'Ok',
            Cancel: 'Cancel'
        };
        this.roles = {
            about: 'About Pendleton',
            services: 'Services',
            hide: 'Hide Pendleton',
            hideothers: 'Hide Others',
            unhide: 'Show All',
            copy: 'Copy',
            paste: 'Paste'
        };
        this.dialogTitles = {
            addDataSource: 'Add Data Source',
            editProperties: 'Edit',
            sendASmile: 'Enter Feedback',
            confirmDelete: 'Confirm Deletion',
            clusterCredentials: 'Run Package',
            projectRuns: 'Package Runs',
            join: 'Join'
        };
        this.enums = {
            DecimalMark: {
                0: 'Dot "."',
                1: 'Comma ","'
            },
            EndOfLineConvention: {
                0: 'Unix',
                1: 'Windows'
            },
            SummaryFunction: {
                0: 'Min',
                1: 'Max',
                2: 'Mean',
                3: 'Median',
                4: 'Variance',
                5: 'Standard Deviation',
                6: 'First',
                7: 'Last',
                8: 'Count',
                9: 'Count Distinct',
                10: 'Interquartile Range',
                11: 'Sum'
            },
            SampleType: {
                0: 'Full file',
                1: 'Top 1,000 Rows',
                2: 'Top 10,000 Rows'
            },
            DatabaseType: {
                0: 'Microsoft SQL Server',
                1: 'MySQL'
            },
            FileEncoding: {
                0: 'utf-8',
                1: 'iso-8859-1',
                2: 'latin-1',
                3: 'mbcs',
                4: 'ASCII',
                5: 'uft-16',
                6: 'utf-32'
            },
            DatabaseAuthType: {
                0: 'Server Authentication',
                1: 'Windows Authentication'
            }
        };
        this.dataQuality = {
            missing: 'missing',
            valid: 'valid'
        };
        this.notifications = {
            [ViewModel_1.NotificationType.Error]: 'Error encountered',
            [ViewModel_1.NotificationType.UpdateAvailable]: 'Downloading update...',
            [ViewModel_1.NotificationType.UpdateDownloaded]: 'An update is available. Restart to install.'
        };
        this.dataTypes = {
            string: 'String',
            numeric: 'Numeric',
            datetime: 'Date time',
            boolean: 'Boolean'
        };
        this.interactiveEditor = {
            commit: 'Commit',
            cancel: 'Cancel',
            columnDragGroupByHint: 'Drag columns here to group data',
            columnDragSummaryHint: 'Drag columns here to summarize data',
            groupBy: 'Group By',
            aggregate: 'Aggregate',
            column: 'Column',
            newColumn: 'New Column Name',
            previewDataHint: 'Preview data will appear here.',
            invalidInteractionArgsError: 'Preview data not available. Please change the arguments and try again.',
            previousBlockError: 'Preview data not available. Please make sure all preceding Steps succeeded.'
        };
        this.validationMessages0 = {
            'Validation.ColumnNameBlank': 'You must provide a name for the new column.'
        };
        this.validationMessages1 = {
            'Validation.MissingRequiredProperties': 'Please provide values for the following required properties: %1.',
            'Validation.NotValidUnknownReason': 'Validation of the property \'%1\' failed for an unknown reason.',
            'Validation.MissingRequiredProperty': 'Please provide a value for the \'%1\' property before proceeding.',
            'Validation.ColumnExists': 'There is already a column named \'%1\'. Please choose another name.',
            'Validation.ColumnNameNotValidNoSuggestion': 'The name you provided,  \'%1\', is not a valid name.'
        };
        this.validationMessages2 = {
            'Validation.ColumnNameNotValid': 'The name you provided, \'%1\', is not a valid name. Consider using the name \'%2\' instead.'
        };
        this.activationPage = {
            eulaHeading: 'End User License Agreement',
            eulaContent: '<insert appropriate EULA text here>',
            eulaCheckbox: 'I have read and agreed to the End User License Agreement',
            privacyHeading: 'Privacy Notice',
            privacyContent: '<insert appropriate privacy notice here>',
            privacyCheckbox: 'I have read and agreed to the Privacy Notice',
            activate: 'Activate'
        };
    }
}
exports.Localization = Localization;
