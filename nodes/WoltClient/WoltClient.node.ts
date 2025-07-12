import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeConnectionType,
	IHttpRequestOptions,
	IHttpRequestMethods,
} from 'n8n-workflow';

export class WoltClient implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wolt ClientAPI',
		name: 'woltClient',
		icon: 'file:wolt.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with the Wolt API',
		defaults: {
			name: 'Wolt API',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'woltApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Get Menu JSON',
						value: 'getMenu',
						action: 'Retrieves the menu information for a specific venue',
						description:
							'The response includes a resource_url that can be used to poll for the actual menu details',
					},
					{
						name: 'Update Items',
						value: 'updateItems',
						action: 'Update menu items',
						description:
							'Allows bulk updating item data such as price and visibility. This saves time and effort as venues can update their menus on the POS or menu management system and the changes will be reflected on the Wolt app.',
					},
					{
						name: 'Update Inventory',
						value: 'updateInventory',
						action: 'Update menu item inventory',
						description:
							'Allows venues to bulk update inventory quantities for items listed on Wolt. This saves time and effort as venues do not need to worry about receiving orders with out of stock items in them.',
					},
				],
				default: 'updateItems',
			},
			{
				displayName: 'Venue ID',
				name: 'venueId',
				type: 'string',
				default: '',
				required: true,
				description: 'The ID of the venue to update',
			},
			{
				displayName: 'Data',
				name: 'data',
				type: 'json',
				default: JSON.stringify({
					data: [],
				}),

				description: 'The data to send to the API',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const venueId = this.getNodeParameter('venueId', i) as string;
				const data = this.getNodeParameter('data', i) as string | undefined;

				const credentials = await this.getCredentials('woltApi');
				const { username, password, environment, apiKey } = credentials;

				const baseUrl =
					environment === 'production'
						? 'https://pos-integration-service.wolt.com'
						: 'https://pos-integration-service.development.dev.woltapi.com';

				let endpoint = '';
				let method: IHttpRequestMethods = 'PATCH';

				switch (operation) {
					case 'updateItems':
						endpoint = `/venues/${venueId}/items`;
						method = 'PATCH';
						break;
					case 'updateInventory':
						endpoint = `/venues/${venueId}/items/inventory`;
						method = 'PATCH';
					case 'getMenu':
						endpoint = `/v2/venues/${venueId}/menu`;
						method = 'GET';
					default:
						break;
				}

				const options: IHttpRequestOptions = {
					method,
					url: `${baseUrl}${endpoint}`,
					body: method !== 'GET' ? data : undefined,
					json: true,
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
						'WOLT-API-KEY': apiKey as string,
						Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
					},
				};

				const responseData = await this.helpers.httpRequest(options);
				returnData.push({ json: responseData });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message }, error });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error);
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
