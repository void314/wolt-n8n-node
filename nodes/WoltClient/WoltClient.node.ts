import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeConnectionType,
	IHttpRequestOptions,
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
				required: true,
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
				const data = this.getNodeParameter('data', i);

				const credentials = await this.getCredentials('woltApi');
				const { username, password, environment } = credentials;

				const baseUrl =
					environment === 'production'
						? 'https://pos-integration-service.wolt.com'
						: 'https://pos-integration-service.development.dev.woltapi.com';

				let endpoint = '';

				switch (operation) {
					case 'updateItems':
						endpoint = `/venues/${venueId}/items`;
						break;
					case 'updateInventory':
						endpoint = `/venues/${venueId}/items/inventory`;
					default:
						break;
				}

				const options: IHttpRequestOptions = {
					method: 'PATCH',
					url: `${baseUrl}${endpoint}`,
					body: data,
					json: true,
					auth: {
						username: username as string,
						password: password as string,
					},
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
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
