goog.provide('ck.capabilities.AutoScale');
goog.provide('ck.capabilities.Backups');
goog.provide('ck.capabilities.Bigdata');
goog.provide('ck.capabilities.BlockStorage');
goog.provide('ck.capabilities.Database');
goog.provide('ck.capabilities.Deployments');
goog.provide('ck.capabilities.Dns');
goog.provide('ck.capabilities.Files');
goog.provide('ck.capabilities.Loadbalancers');
goog.provide('ck.capabilities.Monitoring');
goog.provide('ck.capabilities.NextGenServers');
goog.provide('ck.capabilities.FirstGenServers');
goog.provide('ck.capabilities.RoleMap');
goog.provide('ck.capabilities.Servers');
goog.provide('ck.capabilities.Tickets');
goog.provide('ck.capabilities.Queues');
goog.provide('ck.capabilities.Billing');
goog.provide('ck.capabilities.Account');
goog.provide('ck.capabilities.RackConnect3');
goog.provide('ck.capabilities.Orchestration');

goog.require('goog.object');
goog.require('ck.autoscale.Role');
goog.require('ck.bigdata.Roles');
goog.require('ck.blockstorage.Roles');
goog.require('ck.database.Roles');
goog.require('ck.Features');
goog.require('ck.files.Roles');
goog.require('ck.loadbalancer.Roles');
goog.require('ck.queues.Roles');
goog.require('ck.roles.Role');
goog.require('ck.servers.Roles');
goog.require('ck.monitoring.Roles');
goog.require('ck.backup.Roles');
goog.require('ck.billing.Roles');
goog.require('ck.orchestration.Roles');

goog.require('ck.Features');

ck.capabilities.Servers = {
  LIST_SERVERS: goog.events.getUniqueId('LIST_SERVERS'),
  CREATE_SERVER: goog.events.getUniqueId('CREATE_SERVER'),
  DELETE_SERVER: goog.events.getUniqueId('DELETE_SERVER'),
  DELETE_IMAGE: goog.events.getUniqueId('DELETE_IMAGE')
};

ck.capabilities.NextGenServers = {
  // Servers
  LIST_SERVERS: goog.events.getUniqueId('LIST_SERVERS'),
  CREATE_SERVER: goog.events.getUniqueId('CREATE_SERVER'),
  UPDATE_SERVER: goog.events.getUniqueId('UPDATE_SERVER'),
  DELETE_SERVER: goog.events.getUniqueId('DELETE_SERVER'),
  PERFORM_SERVER_ACTION: goog.events.getUniqueId('PERFORM_SERVER_ACTION'),
  CONNECT_VIA_CONSOLE: goog.events.getUniqueId('CONNECT_VIA_CONSOLE'),
  TAG: goog.events.getUniqueId('TAG'),
  // Images
  CREATE_IMAGE: goog.events.getUniqueId('CREATE_IMAGE'),
  DELETE_IMAGE: goog.events.getUniqueId('DELETE_IMAGE'),
  CREATE_SCHEDULE: goog.events.getUniqueId('CREATE_SCHEDULE'),
  DISABLE_SCHEDULE: goog.events.getUniqueId('DISABLE_SCHEDULE'),
  // Networks
  CREATE_NETWORK: goog.events.getUniqueId('CREATE_NETWORK'),
  ADD_NETWORK: goog.events.getUniqueId('ADD_NETWORK'),
  DISCONNECT_NETWORK: goog.events.getUniqueId('DISCONNECT_NETWORK'),
  LIST_NETWORKS: goog.events.getUniqueId('LIST_NETWORKS'),
  // Volumes
  ATTACH_VOLUME: goog.events.getUniqueId('ATTACH_VOLUME'),
  DETACH_VOLUME: goog.events.getUniqueId('DETACH_VOLUME'),
  // SSH Keys
  DELETE_SSH_KEY: goog.events.getUniqueId('DELETE_SSH_KEY'),
  CREATE_SSH_KEY: goog.events.getUniqueId('CREATE_SSH_KEY'),
  VIEW_SSH_KEY: goog.events.getUniqueId('VIEW_SSH_KEY')
};

ck.capabilities.FirstGenServers = {
  // Servers
  LIST_SERVERS: goog.events.getUniqueId('LIST_SERVERS'),
  CREATE_SERVER: goog.events.getUniqueId('CREATE_SERVER'),
  UPDATE_SERVER: goog.events.getUniqueId('UPDATE_SERVER'),
  DELETE_SERVER: goog.events.getUniqueId('DELETE_SERVER'),
  PERFORM_SERVER_ACTION: goog.events.getUniqueId('PERFORM_SERVER_ACTION'),
  CONNECT_VIA_CONSOLE: goog.events.getUniqueId('CONNECT_VIA_CONSOLE'),
  TAG: goog.events.getUniqueId('TAG'),
  // Images
  CREATE_IMAGE: goog.events.getUniqueId('CREATE_IMAGE'),
  DELETE_IMAGE: goog.events.getUniqueId('DELETE_IMAGE'),
  CREATE_SCHEDULE: goog.events.getUniqueId('CREATE_SCHEDULE'),
  DISABLE_SCHEDULE: goog.events.getUniqueId('DISABLE_SCHEDULE')
};

ck.capabilities.Loadbalancers = {
  // Loadbalancers
  LIST_LOADBALANCERS: goog.events.getUniqueId('LIST_LOADBALANCERS'),
  LIST_LOADBALANCER_DETAILS: goog.events.getUniqueId('LIST_LOADBALANCER_DETAILS'),
  CREATE_LOADBALANCER: goog.events.getUniqueId('CREATE_LOADBALANCER'),
  UPDATE_LOADBALANCER: goog.events.getUniqueId('UPDATE_LOADBALANCER'),
  REMOVE_LOADBALANCER: goog.events.getUniqueId('REMOVE_LOADBALANCER'),
  // Error Page
  LIST_ERROR_PAGE: goog.events.getUniqueId('LIST_ERROR_PAGE'),
  UPDATE_ERROR_PAGE: goog.events.getUniqueId('UPDATE_ERROR_PAGE'),
  REMOVE_ERROR_PAGE: goog.events.getUniqueId('REMOVE_ERROR_PAGE'),
  // Nodes
  LIST_NODES: goog.events.getUniqueId('LIST_NODES'),
  LIST_NODE_DETAILS: goog.events.getUniqueId('LIST_NODE_DETAILS'),
  ADD_NODE: goog.events.getUniqueId('ADD_NODE'),
  ADD_CLOUD_SERVER: goog.events.getUniqueId('ADD_CLOUD_SERVER'),
  MODIFY_NODE: goog.events.getUniqueId('MODIFY_NODE'),
  REMOVE_NODE: goog.events.getUniqueId('REMOVE_NODE'),
  // Virtual IPs
  LIST_VIRTUAL_IPS: goog.events.getUniqueId('LIST_VIRTUAL_IPS'),
  ADD_VIRTUAL_IPV6: goog.events.getUniqueId('ADD_VIRTUAL_IPV6'),
  REMOVE_VIRTUAL_IP: goog.events.getUniqueId('REMOVE_VIRTUAL_IP'),
  // Usage
  // Manage Access Lists
  LIST_ACCESS_LISTS: goog.events.getUniqueId('LIST_ACCESS_LISTS'),
  CREATE_ACCESS_LIST: goog.events.getUniqueId('CREATE_ACCESS_LIST'),
  REMOVE_ACCESS_LIST: goog.events.getUniqueId('REMOVE_ACCESS_LIST'),
  // Monitor Health
  LIST_HEALTH_MONITOR: goog.events.getUniqueId('LIST_HEALTH_MONITOR'),
  UPDATE_HEALTH_MONITOR: goog.events.getUniqueId('UPDATE_HEALTH_MONITOR'),
  REMOVE_HEALTH_MONITOR: goog.events.getUniqueId('REMOVE_HEALTH_MONITOR'),
  // Session Persistence
  LIST_SESSION_PERSISTENCE: goog.events.getUniqueId('LIST_SESSION_PERSISTENCE'),
  ENABLE_SESSION_PERSISTENCE: goog.events.getUniqueId('ENABLE_SESSION_PERSISTENCE'),
  DISABLE_SESSION_PERSISTENCE: goog.events.getUniqueId('DISABLE_SESSION_PERSISTENCE'),
  // Connection Logging
  LIST_CONNECTION_LOGGING: goog.events.getUniqueId('LIST_CONNECTION_LOGGING'),
  ENABLE_DISABLE_CONNECTION_LOGGING: goog.events.getUniqueId('ENABLE_DISABLE_CONNECTION_LOGGING'),
  // Throttle Connections
  LIST_CONNECTION_THROTTLING: goog.events.getUniqueId('LIST_CONNECTION_THROTTLING'),
  UPDATE_CONNECTION_THROTTLING: goog.events.getUniqueId('UPDATE_CONNECTION_THROTTLING'),
  REMOVE_CONNECTION_THROTTLING: goog.events.getUniqueId('REMOVE_CONNECTION_THROTTLING'),
  // Content Caching
  LIST_CONTENT_CACHING: goog.events.getUniqueId('LIST_CONTENT_CACHING'),
  ENABLE_DISABLE_CONTENT_CACHING: goog.events.getUniqueId('ENABLE_DISABLE_CONTENT_CACHING'),
  // Protocols
  LIST_PROTOCOLS: goog.events.getUniqueId('LIST_PROTOCOLS'),
  // Algorithms
  LIST_ALGORITHMS: goog.events.getUniqueId('LIST_ALGORITHMS'),
  // SSL Termination
  LIST_SSL_TERMINATION: goog.events.getUniqueId('LIST_SSL_TERMINATION'),
  UPDATE_SSL_TERMINATION: goog.events.getUniqueId('UPDATE_SSL_TERMINATION'),
  REMOVE_SSL_TERMINATION: goog.events.getUniqueId('REMOVE_SSL_TERMINATION'),
  // Metadata
  // Events
  VIEW_NODE_SERVICE_EVENTS: goog.events.getUniqueId('VIEW_NODE_SERVICE_EVENTS'),
  // Limits
  LIST_ABSOLUTE_LIMITS: goog.events.getUniqueId('LIST_ABSOLUTE_LIMITS')
};
ck.capabilities.Loadbalancers.PICK_SERVER_AS_NODE = [
  ck.capabilities.Loadbalancers.ADD_NODE,
  ck.capabilities.Servers.LIST_SERVERS
];

ck.capabilities.Database = {
  // Instances
  LIST_INSTANCES: goog.events.getUniqueId('LIST_INSTANCES'),
  LIST_INSTANCE_DETAILS: goog.events.getUniqueId('LIST_INSTANCE_DETAILS'),
  LIST_ROOT_USER_STATUS: goog.events.getUniqueId('LIST_ROOT_USER_STATUS'),
  CREATE_INSTANCE: goog.events.getUniqueId('CREATE_INSTANCE'),
  ENABLE_ROOT_USER: goog.events.getUniqueId('ENABLE_ROOT_USER'),
  RESTART_INSTANCE: goog.events.getUniqueId('RESTART_INSTANCE'),
  RESIZE_INSTANCE: goog.events.getUniqueId('RESIZE_INSTANCE'),
  RESIZE_INSTANCE_VOLUME: goog.events.getUniqueId('RESIZE_INSTANCE_VOLUME'),
  DELETE_INSTANCE: goog.events.getUniqueId('DELETE_INSTANCE'),

  // Instance Backups
  DELETE_BACKUP: goog.events.getUniqueId('DELETE_BACKUP'),
  RESTORE_BACKUP: goog.events.getUniqueId('RESTORE_BACKUP'),

  // Databases
  LIST_DATABASES: goog.events.getUniqueId('LIST_DATABASES'),
  CREATE_DATABASE: goog.events.getUniqueId('CREATE_DATABASE'),
  DELETE_DATABASE: goog.events.getUniqueId('DELETE_DATABASE'),

  // Users
  LIST_USER_DETAILS: goog.events.getUniqueId('LIST_USER_DETAILS'),
  CREATE_USER: goog.events.getUniqueId('CREATE_USER'),
  EDIT_USER: goog.events.getUniqueId('EDIT_USER'),
  CHANGE_USER_PASSWORD: goog.events.getUniqueId('CHANGE_USER_PASSWORD'),
  GRANT_USER_ACCESS: goog.events.getUniqueId('GRANT_USER_ACCESS'),
  REVOKE_USER_ACCESS: goog.events.getUniqueId('REVOKE_USER_ACCESS'),
  DELETE_USER: goog.events.getUniqueId('DELETE_USER'),

  // Flavors
  LIST_FLAVORS: goog.events.getUniqueId('LIST_FLAVORS'),
  LIST_FLAVOR_DETAILS: goog.events.getUniqueId('LIST_FLAVOR_DETAILS'),

  // Backups
  CREATE_BACKUP: goog.events.getUniqueId('CREATE_BACKUP'),
  LIST_BACKUPS: goog.events.getUniqueId('LIST_BACKUPS')
};

ck.capabilities.Dns = {
  VIEW_DNS_RECORDS: goog.events.getUniqueId('VIEW_DNS_RECORDS')
};

ck.capabilities.Files = {
  READ_ACCOUNT_METADATA: goog.events.getUniqueId('READ_ACCOUNT_METADATA'),
  WRITE_ACCOUNT_METADATA: goog.events.getUniqueId('WRITE_ACCOUNT_METADATA'),
  LIST_CONTAINERS: goog.events.getUniqueId('LIST_CONTAINERS'),
  CREATE_CONTAINER: goog.events.getUniqueId('CREATE_CONTAINER'),
  DELETE_CONTAINER: goog.events.getUniqueId('DELETE_CONTAINER'),
  READ_CONTAINER_METADATA: goog.events.getUniqueId('READ_CONTAINER_METADATA'),
  WRITE_CONTAINER_METADATA: goog.events.getUniqueId('WRITE_CONTAINER_METADATA'),
  LIST_OBJECTS: goog.events.getUniqueId('LIST_OBJECTS'),
  READ_OBJECT: goog.events.getUniqueId('READ_OBJECT'),
  CREATE_OBJECT: goog.events.getUniqueId('CREATE_OBJECT'),
  COPY_OBJECT: goog.events.getUniqueId('COPY_OBJECT'),
  DELETE_OBJECT: goog.events.getUniqueId('DELETE_OBJECT'),
  READ_OBJECT_METADATA: goog.events.getUniqueId('READ_OBJECT_METADATA'),
  WRITE_OBJECT_METADATA: goog.events.getUniqueId('WRITE_OBJECT_METADATA')
};

/**
 * @enum {string}
 */
ck.capabilities.Monitoring = {
  LIST_ENTITIES: goog.events.getUniqueId('LIST_ENTITIES'),
  INSTALL_AGENT: goog.events.getUniqueId('INSTALL_AGENT'),
  CREATE_CHECK: goog.events.getUniqueId('CREATE_CHECK'),
  DELETE_CHECK: goog.events.getUniqueId('DELETE_CHECK'),
  UPDATE_CHECK: goog.events.getUniqueId('UPDATE_CHECK'),
  CREATE_ALARM: goog.events.getUniqueId('CREATE_ALARM'),
  RENAME_ALARM: goog.events.getUniqueId('RENAME_ALARM'),
  CHANGE_PLAN: goog.events.getUniqueId('CHANGE_PLAN'),
  EDIT_CRITERIA: goog.events.getUniqueId('EDIT_CRITERIA'),
  DELETE_ALARM: goog.events.getUniqueId('DELETE_ALARM')
};

ck.capabilities.BlockStorage = {
  LIST_VOLUMES: goog.events.getUniqueId('LIST_VOLUMES'),
  CREATE_VOLUME: goog.events.getUniqueId('CREATE_VOLUME'),
  CLONE_VOLUME: goog.events.getUniqueId('CLONE_VOLUME'),
  DELETE_VOLUME: goog.events.getUniqueId('DELETE_VOLUME'),
  CREATE_SNAPSHOT: goog.events.getUniqueId('CREATE_SNAPSHOT'),
  LIST_SNAPSHOTS: goog.events.getUniqueId('LIST_SNAPSHOTS'),
  DELETE_SNAPSHOT: goog.events.getUniqueId('DELETE_SNAPSHOT'),
  ATTACH_VOLUME: goog.events.getUniqueId('ATTACH_VOLUME'),
  DETACH_VOLUME: goog.events.getUniqueId('DETACH_VOLUME'),
  RENAME_VOLUME: goog.events.getUniqueId('RENAME_VOLUME')
};
ck.capabilities.BlockStorage.ACCESS_BLOCK_STORAGE = [
  ck.capabilities.NextGenServers.LIST_SERVERS,
  ck.capabilities.BlockStorage.LIST_VOLUMES
];
ck.capabilities.BlockStorage.ATTACH_TO_SERVER = [
  ck.capabilities.NextGenServers.ATTACH_VOLUME,
  ck.capabilities.BlockStorage.ATTACH_VOLUME
];
ck.capabilities.BlockStorage.DETACH_FROM_SERVER = [
  ck.capabilities.NextGenServers.DETACH_VOLUME,
  ck.capabilities.BlockStorage.DETACH_VOLUME
];

ck.capabilities.Backups = {
  SHOW_BACKUP: goog.events.getUniqueId('SHOW_BACKUP')
};

ck.capabilities.Tickets = {
  CLOSE: goog.events.getUniqueId('CLOSE')
};

ck.capabilities.Queues = {
  CREATE_QUEUE: goog.events.getUniqueId('CREATE_QUEUE'),
  DELETE_QUEUE: goog.events.getUniqueId('DELETE_QUEUE'),
  LIST_QUEUES: goog.events.getUniqueId('LIST_QUEUES'),
  VIEW_QUEUE: goog.events.getUniqueId('VIEW_QUEUE')
};

ck.capabilities.AutoScale = {
  LIST_GROUPS: goog.events.getUniqueId('LIST_GROUPS'),
  VIEW_GROUP: goog.events.getUniqueId('VIEW_GROUP'),
  CREATE_GROUP: goog.events.getUniqueId('CREATE_GROUP'),
  UPDATE_GROUP: goog.events.getUniqueId('UPDATE_GROUP'),
  DELETE_GROUP: goog.events.getUniqueId('DELETE_GROUP'),
  CREATE_POLICY: goog.events.getUniqueId('CREATE_POLICY'),
  UPDATE_POLICY: goog.events.getUniqueId('UPDATE_POLICY'),
  DELETE_POLICY: goog.events.getUniqueId('DELETE_POLICY'),
  UPDATE_LAUNCH_CONFIGURATION: goog.events.getUniqueId('UPDATE_LAUNCH_CONFIGURATION')
};
ck.capabilities.AutoScale.ACCESS_CREATE_GROUP = [
  ck.capabilities.NextGenServers.LIST_SERVERS,
  ck.capabilities.Loadbalancers.LIST_LOADBALANCERS,
  ck.capabilities.AutoScale.CREATE_GROUP
];
ck.capabilities.AutoScale.ACCESS_LIST_GROUPS = [
  ck.capabilities.NextGenServers.LIST_SERVERS,
  ck.capabilities.Loadbalancers.LIST_LOADBALANCERS,
  ck.capabilities.AutoScale.LIST_GROUPS
];

ck.capabilities.Deployments = {
  LIST_DEPLOYMENTS: goog.events.getUniqueId('LIST_DEPLOYMENTS')
};

ck.capabilities.Bigdata = {
  VIEW_CLUSTER: goog.events.getUniqueId('VIEW_CLUSTER'),
  CREATE_CLUSTER: goog.events.getUniqueId('CREATE_CLUSTER'),
  RESIZE_CLUSTER: goog.events.getUniqueId('RESIZE_CLUSTER'),
  DELETE_CLUSTER: goog.events.getUniqueId('DELETE_CLUSTER'),
  VIEW_NODE_SERVICES: goog.events.getUniqueId('VIEW_NODE_SERVICES')
};

ck.capabilities.Billing = {
  CREATE_PAYMENT: goog.events.getUniqueId('CREATE_PAYMENT'),
  EDIT_CREDIT_CARD: goog.events.getUniqueId('EDIT_CREDIT_CARD'),
  EDIT_VAT: goog.events.getUniqueId('EDIT_VAT'),
  VIEW_BILLING: goog.events.getUniqueId('VIEW_BILLING')
};

ck.capabilities.Account = {
  VIEW_RESOURCE_LIMITS: goog.events.getUniqueId('VIEW_RESOURCE_LIMITS')
};

ck.capabilities.Orchestration = {
  VIEW_STACKS: goog.events.getUniqueId('VIEW_STACKS'),
  DELETE_STACK: goog.events.getUniqueId('DELETE_STACK'),
  CREATE_STACK: goog.events.getUniqueId('CREATE_STACK')
};

ck.capabilities.RackConnect3 = {
  LIST_LOADBALANCER_POOLS: goog.events.getUniqueId('LIST_LOADBALANCER_POOLS')
};

ck.capabilities.RoleMap[ck.orchestration.Roles.ADMIN] = goog.object.getValues(ck.capabilities.Orchestration);
ck.capabilities.RoleMap[ck.orchestration.Roles.CREATOR] = [
  ck.capabilities.Orchestration.VIEW_STACKS,
  ck.capabilities.Orchestration.CREATE_STACK
];
ck.capabilities.RoleMap[ck.orchestration.Roles.OBSERVER] = [
  ck.capabilities.Orchestration.VIEW_STACKS
];

ck.capabilities.RoleMap[ck.blockstorage.Roles.ADMIN] = goog.object.getValues(ck.capabilities.BlockStorage);
ck.capabilities.RoleMap[ck.blockstorage.Roles.CREATOR] = [
  ck.capabilities.BlockStorage.LIST_VOLUMES,
  ck.capabilities.BlockStorage.CREATE_VOLUME,
  ck.capabilities.BlockStorage.CLONE_VOLUME,
  ck.capabilities.BlockStorage.LIST_SNAPSHOTS,
  ck.capabilities.BlockStorage.CREATE_SNAPSHOT,
  ck.capabilities.BlockStorage.ACCESS_BLOCK_STORAGE,
  ck.capabilities.BlockStorage.ATTACH_VOLUME,
  ck.capabilities.BlockStorage.RENAME_VOLUME
];
ck.capabilities.RoleMap[ck.blockstorage.Roles.OBSERVER] = [
  ck.capabilities.BlockStorage.LIST_VOLUMES,
  ck.capabilities.BlockStorage.LIST_SNAPSHOTS,
  ck.capabilities.BlockStorage.ACCESS_BLOCK_STORAGE
];

ck.capabilities.RoleMap[ck.database.Roles.ADMIN] = goog.object.getValues(ck.capabilities.Database);
ck.capabilities.RoleMap[ck.database.Roles.OBSERVER] = [
  ck.capabilities.Database.LIST_INSTANCES,
  ck.capabilities.Database.LIST_INSTANCE_DETAILS,
  ck.capabilities.Database.LIST_ROOT_USER_STATUS,
  ck.capabilities.Database.LIST_DATABASES,
  ck.capabilities.Database.LIST_USER_DETAILS,
  ck.capabilities.Database.LIST_FLAVORS,
  ck.capabilities.Database.LIST_BACKUPS,
  ck.capabilities.Database.LIST_FLAVOR_DETAILS
];
ck.capabilities.RoleMap[ck.database.Roles.CREATOR] = goog.array.concat(
  ck.capabilities.RoleMap[ck.database.Roles.OBSERVER], [
    ck.capabilities.Database.CREATE_INSTANCE,
    ck.capabilities.Database.CREATE_DATABASE,
    ck.capabilities.Database.CREATE_USER,
    ck.capabilities.Database.GRANT_USER_ACCESS,
    ck.capabilities.Database.CREATE_BACKUP,
    ck.capabilities.Database.RESTORE_BACKUP
  ]
);

ck.capabilities.RoleMap[ck.files.Roles.ADMIN] = goog.object.getValues(ck.capabilities.Files);
ck.capabilities.RoleMap[ck.files.Roles.OBSERVER] = [
  ck.capabilities.Files.READ_ACCOUNT_METADATA,
  ck.capabilities.Files.LIST_CONTAINERS,
  ck.capabilities.Files.READ_CONTAINER_METADATA,
  ck.capabilities.Files.LIST_OBJECTS,
  ck.capabilities.Files.READ_OBJECT,
  ck.capabilities.Files.READ_OBJECT_METADATA
];

ck.capabilities.RoleMap[ck.monitoring.Roles.ADMIN] = goog.object.getValues(ck.capabilities.Monitoring);
ck.capabilities.RoleMap[ck.monitoring.Roles.CREATOR] = [
  ck.capabilities.Monitoring.LIST_ENTITIES,
  ck.capabilities.Monitoring.INSTALL_AGENT,
  ck.capabilities.Monitoring.CREATE_CHECK,
  ck.capabilities.Monitoring.CREATE_ALARM
];
ck.capabilities.RoleMap[ck.monitoring.Roles.OBSERVER] = [
  ck.capabilities.Monitoring.LIST_ENTITIES
];

ck.capabilities.RoleMap[ck.queues.Roles.ADMIN] = goog.object.getValues(ck.capabilities.Queues);
ck.capabilities.RoleMap[ck.queues.Roles.CREATOR] = [
  ck.capabilities.Queues.CREATE_QUEUE,
  ck.capabilities.Queues.LIST_QUEUES,
  ck.capabilities.Queues.VIEW_QUEUE
];
ck.capabilities.RoleMap[ck.queues.Roles.OBSERVER] = [
  ck.capabilities.Queues.LIST_QUEUES,
  ck.capabilities.Queues.VIEW_QUEUE
];

ck.capabilities.RoleMap[ck.autoscale.Role.ADMIN] = goog.object.getValues(ck.capabilities.AutoScale);
ck.capabilities.RoleMap[ck.autoscale.Role.OBSERVER] = [
  ck.capabilities.AutoScale.LIST_GROUPS,
  ck.capabilities.AutoScale.VIEW_GROUP
];

ck.capabilities.RoleMap[ck.loadbalancer.Roles.ADMIN] = goog.object.getValues(ck.capabilities.Loadbalancers);
ck.capabilities.RoleMap[ck.loadbalancer.Roles.OBSERVER] = [
  ck.capabilities.Loadbalancers.LIST_ABSOLUTE_LIMITS,
  ck.capabilities.Loadbalancers.LIST_ACCESS_LISTS,
  ck.capabilities.Loadbalancers.LIST_ALGORITHMS,
  ck.capabilities.Loadbalancers.LIST_CONNECTION_LOGGING,
  ck.capabilities.Loadbalancers.LIST_CONNECTION_THROTTLING,
  ck.capabilities.Loadbalancers.LIST_CONTENT_CACHING,
  ck.capabilities.Loadbalancers.LIST_HEALTH_MONITOR,
  ck.capabilities.Loadbalancers.LIST_LOADBALANCER_DETAILS,
  ck.capabilities.Loadbalancers.LIST_LOADBALANCERS,
  ck.capabilities.Loadbalancers.LIST_NODE_DETAILS,
  ck.capabilities.Loadbalancers.LIST_NODES,
  ck.capabilities.Loadbalancers.LIST_PROTOCOLS,
  ck.capabilities.Loadbalancers.LIST_SESSION_PERSISTENCE,
  ck.capabilities.Loadbalancers.LIST_SSL_TERMINATION,
  ck.capabilities.Loadbalancers.LIST_VIRTUAL_IPS,
  ck.capabilities.Loadbalancers.VIEW_NODE_SERVICE_EVENTS
];
ck.capabilities.RoleMap[ck.loadbalancer.Roles.CREATOR] = goog.array.concat(
  ck.capabilities.RoleMap[ck.loadbalancer.Roles.OBSERVER],
  [
    ck.capabilities.Loadbalancers.ADD_NODE,
    ck.capabilities.Loadbalancers.ADD_VIRTUAL_IPV6,
    ck.capabilities.Loadbalancers.CREATE_ACCESS_LIST,
    ck.capabilities.Loadbalancers.CREATE_LOADBALANCER,
    ck.capabilities.Loadbalancers.ENABLE_DISABLE_CONNECTION_LOGGING,
    ck.capabilities.Loadbalancers.ENABLE_DISABLE_CONTENT_CACHING,
    ck.capabilities.Loadbalancers.MODIFY_NODE,
    ck.capabilities.Loadbalancers.UPDATE_LOADBALANCER
  ]
);

ck.capabilities.RoleMap[ck.servers.Roles.NextGen.ADMIN] = goog.array.concat(
  goog.object.getValues(ck.capabilities.NextGenServers),
  goog.object.getValues(ck.capabilities.Servers),
  [
    ck.capabilities.Account.VIEW_RESOURCE_LIMITS,
    ck.capabilities.RackConnect3.LIST_LOADBALANCER_POOLS
  ]
);
ck.capabilities.RoleMap[ck.servers.Roles.NextGen.OBSERVER] = [
  ck.capabilities.NextGenServers.LIST_SERVERS,
  ck.capabilities.Servers.LIST_SERVERS,
  ck.capabilities.NextGenServers.LIST_NETWORKS,
  ck.capabilities.Account.VIEW_RESOURCE_LIMITS,
  ck.capabilities.RackConnect3.LIST_LOADBALANCER_POOLS
];
ck.capabilities.RoleMap[ck.servers.Roles.NextGen.CREATOR] = goog.array.concat(
  ck.capabilities.RoleMap[ck.servers.Roles.NextGen.OBSERVER],
  [
    ck.capabilities.NextGenServers.CREATE_SERVER,
    ck.capabilities.NextGenServers.CREATE_SCHEDULE,
    ck.capabilities.NextGenServers.CREATE_NETWORK,
    ck.capabilities.NextGenServers.ADD_NETWORK,
    ck.capabilities.NextGenServers.ATTACH_VOLUME,
    ck.capabilities.Servers.CREATE_SERVER,
    ck.capabilities.NextGenServers.CREATE_SSH_KEY,
    ck.capabilities.NextGenServers.DELETE_SSH_KEY,
    ck.capabilities.NextGenServers.VIEW_SSH_KEY
  ]
);

ck.capabilities.RoleMap[ck.servers.Roles.FirstGen.ADMIN] = goog.array.concat(
  goog.object.getValues(ck.capabilities.FirstGenServers),
  goog.object.getValues(ck.capabilities.Servers)
);
ck.capabilities.RoleMap[ck.servers.Roles.FirstGen.OBSERVER] = [
  ck.capabilities.FirstGenServers.LIST_SERVERS,
  ck.capabilities.Servers.LIST_SERVERS
];

ck.capabilities.RoleMap[ck.backup.Roles.ADMIN] = [
  ck.capabilities.Backups.SHOW_BACKUP
];
ck.capabilities.RoleMap[ck.backup.Roles.CREATOR] = [
  ck.capabilities.Backups.SHOW_BACKUP
];
ck.capabilities.RoleMap[ck.backup.Roles.OBSERVER] = [
  ck.capabilities.Backups.SHOW_BACKUP
];

ck.capabilities.RoleMap[ck.billing.Roles.ADMIN] = [
  ck.capabilities.Billing.CREATE_PAYMENT,
  ck.capabilities.Billing.EDIT_CREDIT_CARD,
  ck.capabilities.Billing.VIEW_BILLING
];

ck.capabilities.RoleMap[ck.billing.Roles.OBSERVER] = [
  ck.capabilities.Billing.VIEW_BILLING
];

ck.capabilities.RoleMap[ck.bigdata.Roles.ADMIN] = goog.object.getValues(ck.capabilities.Bigdata);

ck.capabilities.RoleMap[ck.bigdata.Roles.CREATOR] = [
  ck.capabilities.Bigdata.VIEW_CLUSTER,
  ck.capabilities.Bigdata.CREATE_CLUSTER,
  ck.capabilities.Bigdata.RESIZE_CLUSTER,
  ck.capabilities.Bigdata.VIEW_NODE_SERVICES
];

ck.capabilities.RoleMap[ck.bigdata.Roles.OBSERVER] = [
  ck.capabilities.Bigdata.VIEW_CLUSTER,
  ck.capabilities.Bigdata.VIEW_NODE_SERVICES
];

ck.capabilities.RoleMap[ck.roles.Role.USER] = goog.object.getValues(ck.capabilities.Tickets);

ck.capabilities.RoleMap[ck.roles.Role.GLOBAL_ADMIN] = goog.array.concat(
  ck.capabilities.RoleMap[ck.monitoring.Roles.ADMIN],
  ck.capabilities.RoleMap[ck.servers.Roles.FirstGen.ADMIN],
  ck.capabilities.RoleMap[ck.servers.Roles.NextGen.ADMIN],
  ck.capabilities.RoleMap[ck.files.Roles.ADMIN],
  ck.capabilities.RoleMap[ck.database.Roles.ADMIN],
  ck.capabilities.RoleMap[ck.loadbalancer.Roles.ADMIN],
  ck.capabilities.RoleMap[ck.queues.Roles.ADMIN],
  ck.capabilities.RoleMap[ck.autoscale.Role.ADMIN],
  ck.capabilities.RoleMap[ck.blockstorage.Roles.ADMIN],
  ck.capabilities.RoleMap[ck.backup.Roles.ADMIN],
  ck.capabilities.RoleMap[ck.roles.Role.USER],
  ck.capabilities.RoleMap[ck.bigdata.Roles.ADMIN]
);

ck.capabilities.RoleMap[ck.roles.Role.GLOBAL_OBSERVER] = goog.array.concat(
  ck.capabilities.RoleMap[ck.monitoring.Roles.OBSERVER],
  ck.capabilities.RoleMap[ck.servers.Roles.FirstGen.OBSERVER],
  ck.capabilities.RoleMap[ck.servers.Roles.NextGen.OBSERVER],
  ck.capabilities.RoleMap[ck.files.Roles.OBSERVER],
  ck.capabilities.RoleMap[ck.database.Roles.OBSERVER],
  ck.capabilities.RoleMap[ck.loadbalancer.Roles.OBSERVER],
  ck.capabilities.RoleMap[ck.queues.Roles.OBSERVER],
  ck.capabilities.RoleMap[ck.autoscale.Role.OBSERVER],
  ck.capabilities.RoleMap[ck.blockstorage.Roles.OBSERVER],
  ck.capabilities.RoleMap[ck.backup.Roles.OBSERVER],
  ck.capabilities.RoleMap[ck.roles.Role.USER],
  ck.capabilities.RoleMap[ck.bigdata.Roles.OBSERVER]
);

(function () {
  if (ck.Features.hasOrchestration()) {
    goog.array.extend(
      ck.capabilities.RoleMap[ck.roles.Role.GLOBAL_ADMIN],
      ck.capabilities.RoleMap[ck.orchestration.Roles.ADMIN]
    );
    goog.array.extend(
      ck.capabilities.RoleMap[ck.roles.Role.GLOBAL_OBSERVER],
      ck.capabilities.RoleMap[ck.orchestration.Roles.OBSERVER]
    );
  }
}());
